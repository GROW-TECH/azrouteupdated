// app/api/student/courses/enrolled/route.js
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
      .select("id, firstName, lastName, student_name as name, email")
      .eq("id", decoded.userId)
      .single();

    if (error || !student) return null;

    return {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      name: student.name || `${student.firstName} ${student.lastName}`,
      email: student.email,
      role: "student",
    };
  } catch (err) {
    console.error("Auth verification error:", err);
    return null;
  }
}

// Helper: calculate course stats
function calculateCourseStats(enrollment, course) {
  const completedLessons = enrollment.lessonsProgress.filter(p => p.completed).length;
  const totalLessons = course.sections.reduce((sum, s) => sum + s.lessons.length, 0);

  const remainingTime = course.sections.reduce((total, section) => {
    return total + section.lessons.reduce((secTotal, lesson) => {
      const progress = enrollment.lessonsProgress.find(p => p.lessonId === lesson.id);
      return progress?.completed ? secTotal : secTotal + (lesson.duration || 0);
    }, 0);
  }, 0);

  return {
    completedLessons,
    totalLessons,
    remainingTime,
    completionRate: totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0,
  };
}

// Helper: calculate study streak (last 30 days)
async function getStudyStreak(studentId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: activities, error } = await supabase
    .from("CourseEnrollments")
    .select("lessonsProgress")
    .eq("studentId", studentId)
    .contains("lessonsProgress", [{ lastWatched: { gte: thirtyDaysAgo.toISOString() } }]);

  if (error || !activities) return 0;

  // Flatten lessons and count consecutive days
  const days = activities.flatMap(e =>
    e.lessonsProgress
      .filter(l => new Date(l.lastWatched) >= thirtyDaysAgo)
      .map(l => new Date(l.lastWatched).toDateString())
  );

  let currentStreak = 0;
  let today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    if (days.includes(checkDate.toDateString())) currentStreak++;
    else break;
  }

  return currentStreak;
}

export async function GET(request) {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const sort = searchParams.get("sort") || "recent";

    // Fetch enrollments with courses and teacher
    let { data: enrollments, error } = await supabase
      .from("CourseEnrollments")
      .select(`
        id,
        status,
        progress,
        lessonsProgress,
        enrolledAt,
        completedAt,
        expiresAt,
        certificate,
        lastAccessedAt,
        courseId:Courses(
          id, title, description, thumbnail, totalDuration, sections, teacherId:Teachers(
            id, firstName, lastName, email, profileImage, department, qualification, experience, subjectsToTeach
          )
        )
      `)
      .eq("studentId", user.id);

    if (status) enrollments = enrollments.filter(e => e.status === status);
    if (error) throw error;

    // Sorting
    if (sort === "progress") enrollments.sort((a, b) => b.progress - a.progress);
    else if (sort === "title") enrollments.sort((a, b) => a.courseId.title.localeCompare(b.courseId.title));
    else enrollments.sort((a, b) => new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt));

    const studyStreak = await getStudyStreak(user.id);

    const courses = enrollments.map(enrollment => {
      const course = enrollment.courseId;
      const stats = calculateCourseStats(enrollment, course);

      const teacher = course.teacherId
        ? {
            id: course.teacherId.id,
            name: `${course.teacherId.firstName} ${course.teacherId.lastName}`,
            email: course.teacherId.email,
            avatar: course.teacherId.profileImage,
            department: course.teacherId.department,
            qualification: course.teacherId.qualification,
            experience: course.teacherId.experience,
            subjects: course.teacherId.subjectsToTeach,
          }
        : null;

      return {
        id: course.id,
        enrollmentId: enrollment.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        teacher,
        progress: Math.round(enrollment.progress),
        status: enrollment.status,
        stats: {
          completedLessons: stats.completedLessons,
          totalLessons: stats.totalLessons,
          remainingTime: stats.remainingTime,
          completionRate: Math.round(stats.completionRate),
        },
        lastAccessed: enrollment.lastAccessedAt,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
        expiresAt: enrollment.expiresAt,
        certificate: enrollment.certificate,
        sections: course.sections.map(section => ({
          id: section.id,
          title: section.title,
          order: section.order,
          lessons: section.lessons.map(lesson => {
            const lp = enrollment.lessonsProgress.find(p => p.lessonId === lesson.id) || {};
            return {
              id: lesson.id,
              title: lesson.title,
              duration: lesson.duration,
              type: lesson.type,
              progress: {
                completed: !!lp.completed,
                watchTime: lp.watchTime || 0,
                lastWatched: lp.lastWatched,
              },
            };
          }),
        })),
      };
    });

    // Overall stats
    const overallStats = {
      totalCourses: courses.length,
      activeCourses: courses.filter(c => c.status === "active").length,
      completedCourses: courses.filter(c => c.status === "completed").length,
      averageProgress:
        Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / (courses.length || 1)),
      studyStreak,
      byTeacher: courses.reduce((acc, c) => {
        if (c.teacher) {
          const tid = c.teacher.id;
          if (!acc[tid]) acc[tid] = { name: c.teacher.name, department: c.teacher.department, courses: 0, completedCourses: 0 };
          acc[tid].courses++;
          if (c.status === "completed") acc[tid].completedCourses++;
        }
        return acc;
      }, {}),
    };

    return NextResponse.json({ courses, stats: overallStats });
  } catch (error) {
    console.error("Error fetching enrolled courses:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
