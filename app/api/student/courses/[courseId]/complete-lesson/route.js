// app/api/student/courses/[courseId]/complete-lesson/route.js
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

// POST to mark a lesson as completed
export async function POST(request, { params }) {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { lessonId } = await request.json();
    if (!lessonId) return NextResponse.json({ error: "Lesson ID is required" }, { status: 400 });

    const { courseId } = params;

    // Get enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("CourseEnrollments")
      .select("*")
      .eq("studentId", user.id)
      .eq("courseId", courseId)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json({ error: "Not enrolled in this course" }, { status: 404 });
    }

    // Update lesson progress
    const lessonsProgress = Array.isArray(enrollment.lessonsProgress) ? enrollment.lessonsProgress : [];
    const lessonIndex = lessonsProgress.findIndex(p => p.lessonId === lessonId);

    if (lessonIndex > -1) {
      lessonsProgress[lessonIndex] = {
        ...lessonsProgress[lessonIndex],
        completed: true,
        lastAccessedAt: new Date(),
      };
    } else {
      lessonsProgress.push({
        lessonId,
        completed: true,
        watchTime: 0,
        lastAccessedAt: new Date(),
      });
    }

    // Fetch course to calculate total lessons
    const { data: course, error: courseError } = await supabase
      .from("Courses")
      .select("id, sections, certificateEnabled")
      .eq("id", courseId)
      .single();

    if (courseError || !course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    const totalLessons = course.sections?.reduce(
      (sum, section) => sum + (section.lessons?.length || 0),
      0
    ) || 0;

    const completedLessons = lessonsProgress.filter(l => l.completed).length;
    const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    let certificate = enrollment.certificate || null;
    let completedAt = enrollment.completedAt || null;

    // Check if course is completed
    if (overallProgress === 100 && !enrollment.completedAt) {
      completedAt = new Date();
      if (course.certificateEnabled) {
        certificate = {
          issued: true,
          issuedAt: new Date(),
          url: await generateCertificate(course, user, enrollment),
        };
      }
    }

    // Update enrollment in Supabase
    const { error: updateError } = await supabase
      .from("CourseEnrollments")
      .update({
        lessonsProgress,
        lastAccessedAt: new Date(),
        progress: overallProgress,
        completedAt,
        certificate,
        status: overallProgress === 100 ? "completed" : enrollment.status,
      })
      .eq("id", enrollment.id);

    if (updateError) throw updateError;

    // Format response
    const formattedProgress = {};
    lessonsProgress.forEach(lesson => {
      formattedProgress[lesson.lessonId] = {
        completed: lesson.completed,
        watchTime: lesson.watchTime,
        lastAccessedAt: lesson.lastAccessedAt,
      };
    });

    return NextResponse.json({
      progress: formattedProgress,
      overallProgress,
      completedAt,
      certificate,
    });
  } catch (error) {
    console.error("Error completing lesson:", error);
    return NextResponse.json({ error: "Failed to complete lesson" }, { status: 500 });
  }
}

// Placeholder for certificate generation
async function generateCertificate(course, user, enrollment) {
  // Implement your PDF generation logic or Supabase Storage upload here
  return null;
}
