// app/api/student/courses/active/route.js
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');
  if (!token) return null;

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    const { data: student, error } = await supabase
      .from('Students')
      .select('*')
      .eq('Student_id', decoded.userId)
      .single();

    if (error || !student) return null;
    return student;
  } catch (err) {
    console.error('Auth verification error:', err);
    return null;
  }
}

export async function GET() {
  try {
    const student = await verifyAuth();
    if (!student) {
      return new Response(
        JSON.stringify({ message: 'Not authenticated' }),
        { status: 401 }
      );
    }

    // Fetch active courses for this student
    const { data: courses, error } = await supabase
      .from('Course_Enrollments') 
      .select(`
        id,
        course_title,
        thumbnail,
        progress,
        teacher:first_name,last_name
      `)
      .eq('Student_id', student.Student_id)
      .eq('status', 'active');

    if (error) throw error;

    return new Response(
      JSON.stringify({ courses: courses || [] }), // <- always return { courses: [...] }
      { status: 200 }
    );
  } catch (err) {
    console.error('Active courses fetch error:', err);
    return new Response(
      JSON.stringify({ message: err.message || 'Internal server error' }),
      { status: 500 }
    );
  }
}
