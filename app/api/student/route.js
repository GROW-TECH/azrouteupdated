// app/api/student/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // server-only env
);

function looksLikeUUID(s) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s);
}

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

    // get student row
    const { data: student, error: studentErr } = await supabase
      .from("student_list")
      .select("id, course")
      .eq("email", email)
      .single();

    if (studentErr) return NextResponse.json({ error: studentErr.message }, { status: 500 });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const studentId = student.id;

    // --- totalCourses from student.course (handle CSV or UUID list or single value) ---
    let totalCourses = 0;
    let activeCourses = [];

    if (student.course && typeof student.course === "string") {
      // split on comma and clean
      const items = student.course.split(",").map(s => s.trim()).filter(Boolean);
      totalCourses = items.length;

      // if items look like UUIDs, fetch titles from course table
      const allUUIDs = items.every(i => looksLikeUUID(i));
      if (allUUIDs && items.length > 0) {
        const { data: coursesFromDb, error: courseErr } = await supabase
          .from("course")
          .select("id, title")
          .in("id", items);

        if (!courseErr && coursesFromDb) {
          // preserve original order
          const map = new Map(coursesFromDb.map(c => [c.id, c.title]));
          activeCourses = items.map(id => ({ id, title: map.get(id) ?? id }));
        } else {
          // fallback: just return the raw items as titles
          activeCourses = items.map(t => ({ title: t }));
        }
      } else {
        // items are titles (or plain text)
        activeCourses = items.map(t => ({ title: t }));
      }
    } else {
      totalCourses = 0;
      activeCourses = [];
    }

    // --- attendance percent (count of P / total) ---
    const totalResp = await supabase
      .from("student_attendance")
      .select("*", { count: "exact", head: true })
      .eq("student_id", studentId);

    if (totalResp.error) return NextResponse.json({ error: totalResp.error.message }, { status: 500 });
    const totalCount = totalResp.count ?? 0;

    const presentResp = await supabase
      .from("student_attendance")
      .select("*", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("status", "P");

    if (presentResp.error) return NextResponse.json({ error: presentResp.error.message }, { status: 500 });
    const presentCount = presentResp.count ?? 0;

    const attendancePercent = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

    // --- video progress: compute aggregate percent ---
    // get rows with watched_seconds, duration_seconds, completed
    const { data: vrows, error: vErr } = await supabase
      .from("course_video_progress")
      .select("watched_seconds, duration_seconds, completed")
      .eq("student_id", studentId);

    if (vErr) return NextResponse.json({ error: vErr.message }, { status: 500 });

    let videoPercent = 0;
    let videoDetails = { totalVideos: 0, completedVideos: 0 };

    if (Array.isArray(vrows) && vrows.length > 0) {
      let accumRatio = 0;
      let counted = 0;
      let completedCount = 0;

      for (const r of vrows) {
        const dur = r.duration_seconds != null ? Number(r.duration_seconds) : null;
        const watched = r.watched_seconds != null ? Number(r.watched_seconds) : 0;
        const completed = !!r.completed;
        if (completed) completedCount++;

        if (dur && dur > 0) {
          accumRatio += Math.min(watched / dur, 1);
          counted++;
        } else {
          // no duration: treat boolean completed as either 1 or 0
          accumRatio += completed ? 1 : 0;
          counted++;
        }
      }

      videoPercent = counted > 0 ? Math.round((accumRatio / counted) * 100) : 0;
      videoDetails = { totalVideos: vrows.length, completedVideos: completedCount };
    }

    // --- assessments: completed attempts for this student (completed_at not null or status = 'completed') ---
    const { data: attempts, error: aErr } = await supabase
      .from("assessment_attempts")
      .select("id, assessment_id, student_email, student_id, started_at, completed_at, score, status")
      .eq("student_id", studentId)
      .in("status", ["completed"]) // if you use 'completed' as status; also include completed_at check below
      .order("completed_at", { ascending: false });

    if (aErr) {
      // fallback: try to fetch attempts and filter in code
      const { data: attemptsAll, error: attemptsAllErr } = await supabase
        .from("assessment_attempts")
        .select("id, assessment_id, student_email, student_id, started_at, completed_at, score, status")
        .eq("student_id", studentId)
        .order("completed_at", { ascending: false });

      if (attemptsAllErr) return NextResponse.json({ error: attemptsAllErr.message }, { status: 500 });
      // filter completed in code
      const filtered = (attemptsAll || []).filter(a => a.status === "completed" || a.completed_at);
      return NextResponse.json({
        totalCourses,
        activeCourses,
        attendance: { percent: attendancePercent, present: presentCount, total: totalCount },
        videoProgress: { percent: videoPercent, ...videoDetails },
        assessments: filtered
      });
    }

    // also include attempts that have completed_at even if status isn't 'completed'
    const attemptsFinal = (attempts || []).filter(a => a.status === "completed" || a.completed_at);

    return NextResponse.json({
      totalCourses,
      activeCourses,
      attendance: { percent: attendancePercent, present: presentCount, total: totalCount },
      videoProgress: { percent: videoPercent, ...videoDetails },
      assessments: attemptsFinal
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
