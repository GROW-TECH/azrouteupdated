import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req) {
  try {
    const { attemptId, answers } = await req.json();

    const { data, error } = await supabase
      .from("assessment_attempts")
      .update({ answers })
      .eq("id", attemptId)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ saved: true, attempt: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
