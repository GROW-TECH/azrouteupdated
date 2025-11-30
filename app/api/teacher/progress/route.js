// app/api/teacher/progress/route.js
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

/* reuse your verifyAuth pattern */
async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token");
  if (!token?.value) return null;
  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    if (decoded.role !== "coach") return null;

    const { data: coach, error } = await supabase
      .from("coaches")
      .select("id, name, email")
      .eq("id", decoded.userId)
      .maybeSingle();

    if (error || !coach) return null;

    return { id: coach.id, name: coach.name, email: coach.email, role: "coach" };
  } catch (err) {
    console.error("Auth verify error:", err);
    return null;
  }
}

export async function GET(request) {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const courseFilter = (searchParams.get("course") || "").trim(); // optional: only that course
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 1000);
    const from = (page - 1) * limit;
    const to = page * limit - 1;

    // 1) fetch courses for this coach (so we restrict to coach courses)
    const { data: coachCourses, error: coursesErr } = await supabase
      .from("course")
      .select("id, title")
      .or(`coach_id_int.eq.${user.id},coach_name.ilike.${user.name}`); // allow either match

    if (coursesErr) {
      console.error("Failed to load coach courses:", coursesErr);
      return NextResponse.json({ error: "Failed to load courses" }, { status: 500 });
    }

    // if coach has no courses, return empty
    const titles = (coachCourses || []).map((c) => (c.title || "").trim()).filter(Boolean);
    if (titles.length === 0) {
      return NextResponse.json({ students: [], total: 0, page, limit });
    }

    // Determine which course titles to include
    let allowedTitles = titles;
    if (courseFilter) {
      // find matching coach course title (case-insensitive, substring)
      const found = titles.find((t) => t.toLowerCase().includes(courseFilter.toLowerCase()));
      if (!found) {
        // no matching course for this coach -> return empty
        return NextResponse.json({ students: [], total: 0, page, limit });
      }
      allowedTitles = [found];
    }

    // 2) fetch all videos for allowed courses
    const { data: videos, error: videosErr } = await supabase
      .from("course_videos")
      .select("id, course_id, duration_seconds")
      .in("course_id", coachCourses.filter(c => allowedTitles.includes(c.title)).map(c => c.id));

    if (videosErr) {
      console.error("Failed to load course videos:", videosErr);
      return NextResponse.json({ error: "Failed to load videos" }, { status: 500 });
    }

    const videoIds = (videos || []).map((v) => v.id);

    // 3) fetch students enrolled in allowedTitles (case-insensitive match)
    // use ILIKE via Supabase by using .ilike for single title; for multiple we do multiple ORs
    let studentsQuery = supabase.from("student_list").select("*", { count: "exact" });
    if (allowedTitles.length === 1) {
      studentsQuery = studentsQuery.ilike("course", `%${allowedTitles[0]}%`);
    } else {
      // multiple: build or string
      // supabase .or accepts comma-separated filters like: "course.ilike.%t1%,course.ilike.%t2%"
      const orParts = allowedTitles.map(t => `course.ilike.%${t.replace(/%/g, '\\%')}%`);
      studentsQuery = studentsQuery.or(orParts.join(","));
    }

    const { data: students, count: studentsCount, error: studentsErr } = await studentsQuery.range(from, to).order("id", { ascending: true });

    if (studentsErr) {
      console.error("Failed to load students:", studentsErr);
      return NextResponse.json({ error: "Failed to load students" }, { status: 500 });
    }

    if (!students || students.length === 0) {
      return NextResponse.json({ students: [], total: Number(studentsCount ?? 0), page, limit });
    }

    const studentIds = students.map((s) => s.id);

    // 4) fetch progress rows for these students and videoIds
    let progressQuery = supabase.from("course_video_progress").select("id, student_id, video_id, watched_seconds, completed");
    // restrict by student_id
    progressQuery = progressQuery.in("student_id", studentIds);
    // restrict by video_id if any videos exist
    if (videoIds.length > 0) progressQuery = progressQuery.in("video_id", videoIds);

    const { data: progressRows, error: progressErr } = await progressQuery;
    if (progressErr) {
      console.error("Failed to load progress rows:", progressErr);
      return NextResponse.json({ error: "Failed to load progress" }, { status: 500 });
    }

    // Build quick lookup for videos durations by id
    const videoById = new Map();
    for (const v of videos || []) {
      // ensure numeric
      const dur = v.duration_seconds == null ? 0 : Number(v.duration_seconds);
      videoById.set(String(v.id), dur);
    }

    // Build per-course video counts/durations to help compute totals per student-course
    // But UI wants per-student row (course they belong to) — we'll compute totals using student's course (string)
    // We'll also compute totals based on videos we fetched that belong to the student's course id(s).

    // Map course_id -> { totalVideos, totalSeconds }
    const videosByCourse = new Map();
    for (const v of videos || []) {
      const key = String(v.course_id);
      const prev = videosByCourse.get(key) || { totalVideos: 0, totalSeconds: 0, videoIds: [] };
      prev.totalVideos += 1;
      prev.totalSeconds += (v.duration_seconds == null ? 0 : Number(v.duration_seconds));
      prev.videoIds.push(String(v.id));
      videosByCourse.set(key, prev);
    }

    // Map studentId -> aggregated progress
    const progressByStudent = new Map();
    for (const s of students) {
      progressByStudent.set(s.id, {
        watched_seconds: 0,
        completed_videos: 0,
        videos_seen: new Set(),
      });
    }

    for (const p of progressRows || []) {
      if (!progressByStudent.has(p.student_id)) continue;
      const agg = progressByStudent.get(p.student_id);
      agg.watched_seconds += Number(p.watched_seconds || 0);
      if (p.completed === true || p.completed === 't' || p.completed === 1) {
        agg.completed_videos += 1;
      }
      agg.videos_seen.add(String(p.video_id));
    }

    // 5) prepare response array: for each student use their course -> find matching course_id(s)
    // Because student_list.course is a string and course.title is string, we earlier matched students by course title
    // Find course id for student's course by case-insensitive match against coachCourses
    const courseTitleToId = new Map();
    for (const c of coachCourses || []) {
      courseTitleToId.set((c.title || "").toString().toLowerCase(), c.id);
    }

    const out = students.map((s) => {
      // find matching course id by case-insensitive contains
      let matchedCourseId = null;
      const studentCourse = (s.course || "").toString().trim().toLowerCase();
      for (const [titleLower, id] of courseTitleToId.entries()) {
        if (studentCourse.includes(titleLower) || titleLower.includes(studentCourse)) {
          matchedCourseId = id;
          break;
        }
      }

      // fallback: if only one allowed course, pick that
      if (!matchedCourseId && coachCourses.length === 1) matchedCourseId = coachCourses[0].id;

      const vMeta = videosByCourse.get(String(matchedCourseId)) || { totalVideos: 0, totalSeconds: 0, videoIds: [] };
      const agg = progressByStudent.get(s.id) || { watched_seconds: 0, completed_videos: 0, videos_seen: new Set() };

      // compute progress %
      let progressPercent = 0;
      if (vMeta.totalSeconds > 0) {
        progressPercent = Math.round((agg.watched_seconds / vMeta.totalSeconds) * 100);
      } else if (vMeta.totalVideos > 0) {
        progressPercent = Math.round((agg.completed_videos / vMeta.totalVideos) * 100);
      } else {
        progressPercent = 0;
      }
      if (progressPercent < 0) progressPercent = 0;
      if (progressPercent > 100) progressPercent = 100;

      return {
        id: s.id,
        reg_no: s.reg_no,
        name: s.name,
        email: s.email,
        phone: s.phone,
        place: s.place,
        course: s.course,
        level: s.level,
        total_videos: vMeta.totalVideos,
        completed_videos: agg.completed_videos,
        watched_seconds: agg.watched_seconds,
        total_seconds: vMeta.totalSeconds,
        progress_percent: progressPercent,
        videos_count_display: `${agg.videos_seen.size}/${vMeta.totalVideos}`,
      };
    });

    return NextResponse.json({ students: out, total: out.length, page, limit });
  } catch (err) {
    console.error("GET /api/teacher/progress error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
