// app/api/attempts/start/route.js
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req) {
  try {
    const body = await req.json();
    const { assessment_id, student_id, student_email } = body;

    if (!assessment_id) {
      return NextResponse.json({ error: "assessment_id required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("assessment_attempts")
      .insert([
        {
          assessment_id,
          student_id: student_id ?? null,
          student_email: student_email ?? null,
          status: "in_progress",
        },
      ])
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ attempt: data }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
