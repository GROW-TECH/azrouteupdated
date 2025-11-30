// app/api/student/courses/[courseId]/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Authenticate student using JWT stored in cookies
async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');

  if (!token) return null;

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    const { data: student, error } = await supabase
      .from('Students')
      .select('id, student_name as name, email, mobile')
      .eq('id', decoded.userId)
      .single();

    if (error || !student) return null;

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      mobile: student.mobile,
      role: 'student'
    };
  } catch (err) {
    console.error('Auth verification error:', err);
    return null;
  }
}

// GET course details for a student
export async function GET(request, { params }) {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { courseId } = params;

    // Fetch course details
    const { data: course, error: courseError } = await supabase
      .from('Courses')
      .select(`
        id, title, description, thumbnail, price, level, category,
        enrollments, rating, totalDuration, totalLessons,
        prerequisites, objectives, sections (
          title, lessons (id, title, duration, videoURL)
        )
      `)
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Fetch student enrollment
    const { data: enrollment } = await supabase
      .from('CourseEnrollments')
      .select('id, status, progress, lessonsProgress, lastAccessedAt, certificate')
      .eq('courseId', courseId)
      .eq('studentId', user.id)
      .single();

    // Format course data
    const formattedCourse = {
      id: course.id,
      title: course.title || '',
      description: course.description || '',
      thumbnail: course.thumbnail || '',
      price: course.price || 0,
      level: course.level || 'beginner',
      category: course.category || 'uncategorized',
      enrollments: course.enrollments || 0,
      rating: course.rating || 0,
      totalDuration: course.totalDuration || 0,
      totalLessons: course.totalLessons || 0,
      prerequisites: Array.isArray(course.prerequisites) ? course.prerequisites : [],
      objectives: Array.isArray(course.objectives) ? course.objectives : [],
      sections: Array.isArray(course.sections)
        ? course.sections.map(section => ({
            title: section.title || '',
            lessons: Array.isArray(section.lessons)
              ? section.lessons.map(lesson => ({
                  id: lesson.id,
                  title: lesson.title || '',
                  duration: lesson.duration || 0,
                  ...(enrollment && lesson.videoURL ? { videoURL: lesson.videoURL } : {})
                }))
              : []
          }))
        : []
    };

    // Format enrollment data
    const formattedEnrollment = enrollment
      ? {
          id: enrollment.id,
          status: enrollment.status || 'pending',
          progress: enrollment.progress || 0,
          lessonsProgress: Array.isArray(enrollment.lessonsProgress)
            ? enrollment.lessonsProgress
            : [],
          lastAccessedAt: enrollment.lastAccessedAt || null,
          certificate: enrollment.certificate || null
        }
      : null;

    return NextResponse.json({ course: formattedCourse, enrollment: formattedEnrollment });

  } catch (error) {
    console.error('Error fetching course details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
