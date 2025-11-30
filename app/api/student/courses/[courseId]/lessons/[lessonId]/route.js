// app/api/student/courses/[courseId]/lessons/[lessonId]/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Authenticate student using JWT stored in cookies
async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token");

  if (!token) return null;

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    const { data: student, error } = await supabase
      .from("Students")
      .select("id, student_name as name, email, mobile")
      .eq("id", decoded.userId)
      .single();

    if (error || !student) return null;

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      mobile: student.mobile,
      role: "student",
    };
  } catch (err) {
    console.error("Auth verification error:", err);
    return null;
  }
}

// GET lesson details
export async function GET(request, { params }) {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId, lessonId } = params;

    // Fetch course with sections and lessons
    const { data: course, error: courseError } = await supabase
      .from("Courses")
      .select("id, sections")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Find the lesson in the course sections
    let lessonData = null;
    for (const section of course.sections || []) {
      const lesson = (section.lessons || []).find(l => l.id === lessonId || l._id === lessonId);
      if (lesson) {
        lessonData = lesson;
        break;
      }
    }

    if (!lessonData) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Format lesson data
    const formattedLesson = {
      id: lessonData.id || lessonData._id,
      title: lessonData.title || "",
      description: lessonData.description || "",
      videoURL: lessonData.videoURL || "",
      duration: lessonData.duration || 0,
      resources: lessonData.resources || [],
    };

    return NextResponse.json({ lesson: formattedLesson });
  } catch (error) {
    console.error("Error fetching lesson details:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
