// app/api/student/goals/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Auth helper
async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');

  if (!token) return null;

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);

    const { data: student, error } = await supabase
      .from('students')
      .select('id, name, email')
      .eq('id', decoded.userId)
      .single();

    if (error || !student) return null;

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      role: 'student'
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

// GET: fetch learning goals
export async function GET(request) {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get active goals
    const { data: goals, error } = await supabase
      .from('learning_goals')
      .select(`
        id, title, type, description, start_date, due_date, course_id,
        target_hours, target_certificates, milestones, status
      `)
      .eq('student_id', user.id)
      .neq('status', 'archived')
      .order('due_date', { ascending: true });

    if (error) throw error;

    // Attach course data and calculate progress
    const goalsWithProgress = await Promise.all(goals.map(async goal => {
      let progress = 0;
      let course = null;

      if (goal.course_id) {
        const { data: courseData } = await supabase
          .from('courses')
          .select('id, title, thumbnail, category, level')
          .eq('id', goal.course_id)
          .single();

        course = courseData || null;

        if (goal.type === 'course_completion') {
          const { data: enrollment } = await supabase
            .from('course_enrollments')
            .select('progress')
            .eq('student_id', user.id)
            .eq('course_id', goal.course_id)
            .single();

          progress = enrollment?.progress || 0;
        }
      }

      if (goal.type === 'study_hours') {
        const totalHours = await calculateStudyHours(user.id, goal.start_date);
        progress = Math.min((totalHours / goal.target_hours) * 100, 100);
      }

      if (goal.type === 'certificates') {
        const { count: certificatesEarned } = await supabase
          .from('course_enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('student_id', user.id)
          .eq('status', 'completed')
          .eq('certificate.issued', true)
          .gte('completed_at', goal.start_date);

        progress = Math.min((certificatesEarned / goal.target_certificates) * 100, 100);
      }

      return {
        id: goal.id,
        title: goal.title,
        type: goal.type,
        description: goal.description,
        startDate: goal.start_date,
        dueDate: goal.due_date,
        progress: Math.round(progress),
        completed: progress === 100,
        course,
        target: {
          hours: goal.target_hours,
          certificates: goal.target_certificates
        },
        milestones: goal.milestones.map(m => ({
          ...m,
          completed: progress >= m.progress_required
        }))
      };
    }));

    return NextResponse.json({
      goals: goalsWithProgress,
      summary: {
        total: goalsWithProgress.length,
        completed: goalsWithProgress.filter(g => g.completed).length,
        upcomingDeadlines: goalsWithProgress.filter(g => !g.completed && new Date(g.dueDate) > new Date()).length
      }
    });
  } catch (error) {
    console.error('Error fetching learning goals:', error);
    return NextResponse.json({ error: 'Failed to fetch learning goals' }, { status: 500 });
  }
}

// POST: create a new learning goal
export async function POST(request) {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { title, type, description, dueDate, courseId, targetHours, targetCertificates, milestones } = body;

    if (!title || !type || !dueDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: goal, error } = await supabase
      .from('learning_goals')
      .insert({
        student_id: user.id,
        title,
        type,
        description,
        start_date: new Date(),
        due_date: new Date(dueDate),
        course_id: type === 'course_completion' ? courseId : null,
        target_hours: type === 'study_hours' ? targetHours : null,
        target_certificates: type === 'certificates' ? targetCertificates : null,
        milestones: milestones || [],
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: 'Goal created successfully',
      goal: {
        id: goal.id,
        title: goal.title,
        type: goal.type,
        dueDate: goal.due_date
      }
    });

  } catch (error) {
    console.error('Error creating learning goal:', error);
    return NextResponse.json({ error: 'Failed to create learning goal' }, { status: 500 });
  }
}

// Helper function to calculate study hours
async function calculateStudyHours(studentId, startDate) {
  const { data: enrollments, error } = await supabase
    .from('course_enrollments')
    .select('lessons_progress')
    .eq('student_id', studentId);

  if (error || !enrollments) return 0;

  let totalHours = 0;
  enrollments.forEach(enrollment => {
    enrollment.lessons_progress.forEach(progress => {
      if (progress.last_watched && new Date(progress.last_watched) >= new Date(startDate)) {
        totalHours += (progress.watch_time || 0) / 3600;
      }
    });
  });

  return totalHours;
}
