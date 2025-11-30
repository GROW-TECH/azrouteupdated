// D:\Student_Coach\Azroute\app\api\auth\student\signup\route.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const { name, email, password, mobile } = await request.json();

    if (!name || !email || !password || !mobile) {
      return new Response(JSON.stringify({ message: 'All required fields must be filled' }), { status: 400 });
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('Students')
      .select('Student_id')
      .eq('email', email)
      .single();

    if (existing) {
      return new Response(JSON.stringify({ message: 'Email already registered' }), { status: 400 });
    }

    // Insert new student (plain password)
    const { data, error } = await supabase
      .from('Students')
      .insert({
        Student_name: name,
        email,
        password,
        mobile
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ message: 'Account created successfully', student: data }), { status: 200 });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ message: err.message || 'Internal server error' }), { status: 500 });
  }
}
