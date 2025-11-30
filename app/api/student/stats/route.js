// app/api/student/stats/route.js
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Helper function to get completion trend over last 6 months
async function getCompletionTrend(studentId) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const { data: completions, error } = await supabase
    .from('Course_Enrollments')
    .select('completed_at')
    .eq('Student_id', studentId)
    .eq('status', 'completed')
    .gte('completed_at', sixMonthsAgo);

  if (error) throw error;

  const trendMap = {};

  completions.forEach(item => {
    const date = new Date(item.completed_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    trendMap[key] = (trendMap[key] || 0) + 1;
  });

  return Object.entries(trendMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, completions: count }));
}

// Helper function to calculate 28-day consistency score
async function calculateConsistencyScore(studentId) {
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const { data: lessons, error } = await supabase
    .from('Course_Enrollments')
    .select('lessons_progress')
    .eq('Student_id', studentId);

  if (error) throw error;

  const activityDays = new Set();

  lessons.forEach(enrollment => {
    enrollment.lessons_progress?.forEach(progress => {
      const watched = new Date(progress.last_watched);
      if (watched >= fourWeeksAgo) {
        const dayKey = watched.toISOString().split('T')[0];
        activityDays.add(dayKey);
      }
    });
  });

  const consistencyScore = (activityDays.size / 28) * 100;
  return Math.round(consistencyScore);
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token');

    if (!authToken) {
      return new Response(JSON.stringify({ message: 'Not authenticated' }), { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(authToken.value, process.env.JWT_SECRET);
    } catch {
      return new Response(JSON.stringify({ message: 'Invalid token' }), { status: 401 });
    }

    const studentId = decoded.userId;

    // Get student info
    const { data: student, error: studentError } = await supabase
      .from('Students')
      .select('Student_id, Student_name, email, mobile')
      .eq('Student_id', studentId)
      .single();

    if (studentError || !student) {
      return new Response(JSON.stringify({ message: 'Student not found' }), { status: 404 });
    }

    // Get enrollments counts
    const { count: totalEnrollments } = await supabase
      .from('Course_Enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('Student_id', studentId);

    const { count: activeCourses } = await supabase
      .from('Course_Enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('Student_id', studentId)
      .eq('status', 'active');

    const { count: completedCourses } = await supabase
      .from('Course_Enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('Student_id', studentId)
      .eq('status', 'completed');

    const [completionTrend, consistencyScore] = await Promise.all([
      getCompletionTrend(studentId),
      calculateConsistencyScore(studentId)
    ]);

    const completionRate = totalEnrollments > 0 ? (completedCourses / totalEnrollments) * 100 : 0;

    const stats = {
      totalEnrollments,
      activeCourses,
      completedCourses,
      completionRate: Math.round(completionRate),
      consistencyScore,
      completionTrend,
      student
    };

    return new Response(JSON.stringify(stats), { status: 200 });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}
