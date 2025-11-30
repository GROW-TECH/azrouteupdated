// app/api/student/courses/progress/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Verify student auth
async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token");

  if (!token) return null;

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    const { data: student, error } = await supabase
      .from("Students")
      .select("id, name, email")
      .eq("id", decoded.userId)
      .single();

    if (error || !student) return null;

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      role: "student",
    };
  } catch (err) {
    console.error("Auth verification error:", err);
    return null;
  }
}

// POST: Update lesson progress
export async function POST(request) {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { courseId, lessonId, progress, watchTime } = body;

    if (!courseId || !lessonId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get enrollment
    const { data: enrollment, error: enrollErr } = await supabase
      .from("CourseEnrollments")
      .select("*")
      .eq("courseId", courseId)
      .eq("studentId", user.id)
      .single();

    if (enrollErr || !enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    // Update lessonsProgress array
    const lessonsProgress = enrollment.lessonsProgress || [];
    const existingLesson = lessonsProgress.find(l => l.lessonId === lessonId);

    if (existingLesson) {
      existingLesson.watchTime = Math.max(existingLesson.watchTime || 0, watchTime || 0);
      if (progress >= 100) existingLesson.completed = true;
      existingLesson.lastWatched = new Date().toISOString();
    } else {
      lessonsProgress.push({
        lessonId,
        completed: progress >= 100,
        watchTime,
        lastWatched: new Date().toISOString(),
      });
    }

    // Calculate overall progress
    const totalLessons = enrollment.totalLessons || lessonsProgress.length;
    const completedLessons = lessonsProgress.filter(l => l.completed).length;
    const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    // Update enrollment record in Supabase
    const { data: updatedEnrollment, error: updateErr } = await supabase
      .from("CourseEnrollments")
      .update({
        lessonsProgress,
        progress: overallProgress,
        lastAccessedAt: new Date().toISOString(),
      })
      .eq("id", enrollment.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    return NextResponse.json({
      message: "Progress updated successfully",
      enrollment: updatedEnrollment,
    });
  } catch (error) {
    console.error("Error updating progress:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
