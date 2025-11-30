// app/api/student/livestreams/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

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

// GET: fetch all active livestreams
export async function GET(req) {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get user's enrolled courses
    const { data: enrollments, error: enrollErr } = await supabase
      .from('course_enrollments')
      .select('course_id')
      .eq('student_id', user.id);

    if (enrollErr) throw enrollErr;

    const courseIds = enrollments.map(e => e.course_id);

    // Get active livestreams: either from enrolled courses or public
    const { data: livestreams, error: lsErr } = await supabase
      .from('livestreams')
      .select('id, title, description, teacher_id, teacher_name, started_at, attendees, course_id, status')
      .or(courseIds.length ? courseIds.map(id => `course_id.eq.${id}`).join(',') + ',course_id.is.null' : 'course_id.is.null')
      .eq('status', 'live')
      .order('started_at', { ascending: false });

    if (lsErr) throw lsErr;

    return NextResponse.json(livestreams);

  } catch (error) {
    console.error('Error fetching livestreams:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
