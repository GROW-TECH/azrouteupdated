// app/api/teacher/courses/route.js
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

/**
 * Local fallback thumbnail (developer-uploaded file).
 */
const UPLOADED_IMAGE_FALLBACK = "/mnt/data/57a37dda-71e8-4e2b-bfa9-294fca3fb3e9.png";

// ------------------------------
// VERIFY AUTH (Supabase Only)
// ------------------------------
async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token");

  if (!token?.value) return null;

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);

    if (decoded.role !== "coach") return null;

    // coaches table primary key is serial integer
    const { data: coach, error } = await supabase
      .from("coaches")
      .select("id, name, email")
      .eq("id", decoded.userId)
      .maybeSingle();

    if (error || !coach) return null;

    return {
      id: coach.id,
      name: coach.name,
      email: coach.email,
      role: "coach",
    };
  } catch (err) {
    console.error("Auth verification error:", err);
    return null;
  }
}

// Helper: get student count for a given course title (case-insensitive)
async function fetchStudentCountForCourse(courseTitle) {
  try {
    if (!courseTitle || !courseTitle.toString().trim()) return 0;

    // ilike with exact value acts as case-insensitive exact match.
    // If you want substring match, use `%${courseTitle}%`
    const { count, error } = await supabase
      .from("student_list")
      .select("id", { count: "exact", head: true })
      .ilike("course", courseTitle.toString().trim());

    if (error) {
      console.error("Error fetching student count for course", courseTitle, error);
      return 0;
    }

    return Number(count ?? 0);
  } catch (err) {
    console.error("fetchStudentCountForCourse error:", err);
    return 0;
  }
}

// ------------------------------------
// GET — Fetch Courses (Supabase)
//   - Adds `student_count` to each course (case-insensitive match to student_list.course)
// ------------------------------------
export async function GET(request) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);
    const search = (searchParams.get("search") || "").trim();
    const status = searchParams.get("status") || "all";

    // base query: select all columns and request exact count for pagination
    let query = supabase
      .from("course")
      .select("*", { count: "exact" })
      // case-insensitive match on coach_name to the coach's name
      .ilike("coach_name", user.name);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (search) {
      // search title (case-insensitive substring)
      query = query.ilike("title", `%${search}%`);
    }

    // order by created_at (schema uses snake_case)
    const from = (page - 1) * limit;
    const to = page * limit - 1;

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Supabase GET error (course):", error);
      return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
    }

    const rows = data || [];

    // Fetch student counts in parallel (case-insensitive match: student_list.course == course.title)
    const rowsWithCounts = await Promise.all(
      rows.map(async (r) => {
        let student_count = 0;
        try {
          // prefer using the course.title (trimmed)
          const courseTitle = (r.title || "").toString().trim();
          student_count = await fetchStudentCountForCourse(courseTitle);
        } catch (e) {
          console.error("Error fetching student count for course row", r.id, e);
          student_count = 0;
        }

        return {
          ...r,
          thumbnail: r.thumbnail || r.pdf_path || UPLOADED_IMAGE_FALLBACK,
          student_count,
        };
      })
    );

    return NextResponse.json({
      courses: rowsWithCounts,
      pagination: {
        total: Number(count ?? 0),
        pages: count ? Math.ceil(count / limit) : 0,
        page,
        limit,
      },
    });
  } catch (err) {
    console.error("Error fetching courses:", err);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

// ------------------------------------
// POST — Create new Course (Supabase)
// ------------------------------------
export async function POST(request) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const courseData = await request.json();

    if (!courseData.title || !courseData.description)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    // sections/lessons ordering (if you use the same structure)
    const sections = (courseData.sections || []).map((section, i) => ({
      ...section,
      order: i + 1,
      lessons: (section.lessons || []).map((lesson, j) => ({
        ...lesson,
        order: j + 1,
      })),
    }));

    const totalDuration = sections.reduce((a, s) => {
      return (
        a + s.lessons.reduce((b, l) => b + (parseInt(l.duration) || 0), 0)
      );
    }, 0);

    const totalLessons = sections.reduce((a, s) => a + (s.lessons || []).length, 0);

    // Build insert payload matching your schema (snake_case)
    const payload = {
      title: courseData.title,
      description: courseData.description,
      level: courseData.level || null,
      price: courseData.price ?? 0,
      status: courseData.status || "draft",
      coach_id: courseData.coach_id || null, // optional UUID FK to coach table
      coach_id_int: user.id, // store serial id too if you want (optional)
      coach_name: user.name, // store coach name (string) as requested
      pdf_path: courseData.pdf_path || null,
      videos: courseData.videos || null,
      sections,
      total_duration: totalDuration,
      total_lessons: totalLessons,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("course")
      .insert([payload])
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Supabase POST error (course):", error);
      return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
    }

    return NextResponse.json({ message: "Course created successfully", course: data });
  } catch (err) {
    console.error("POST error (course):", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ------------------------------------
// PATCH — Update Course (Supabase)
// ------------------------------------
export async function PATCH(request) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { courseId, ...updateData } = body;

    if (!courseId)
      return NextResponse.json({ error: "Course ID required" }, { status: 400 });

    // Fetch existing course to verify ownership: either coach_id_int matches or coach_name matches (case-insensitive)
    const { data: existing, error: fetchErr } = await supabase
      .from("course")
      .select("*")
      .eq("id", courseId)
      .maybeSingle();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // verify ownership: match serial id or case-insensitive name match
    const nameMatches =
      (existing.coach_name ?? "").toString().trim().toLowerCase() ===
      (user.name ?? "").toString().trim().toLowerCase();

    const idMatches = existing.coach_id_int !== null && Number(existing.coach_id_int) === Number(user.id);

    if (!nameMatches && !idMatches) {
      return NextResponse.json({ error: "Not authorized to update this course" }, { status: 403 });
    }

    // If status is present, validate
    if (updateData.status) {
      if (!["draft", "published", "archived"].includes(updateData.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
    }

    // Ensure updated_at uses snake_case
    const { data, error } = await supabase
      .from("course")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", courseId)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Supabase PATCH error (course):", error);
      return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
    }

    return NextResponse.json({ message: "Course updated", course: data });
  } catch (err) {
    console.error("PATCH error (course):", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
