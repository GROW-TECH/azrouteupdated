import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

function normalizeStr(s) {
  if (!s && s !== 0) return "";
  return String(s).trim().toLowerCase();
}

export async function POST(req) {
  try {
    const { attemptId, answers = {} } = await req.json();

    const { data: attempt } = await supabase
      .from("assessment_attempts")
      .select("*")
      .eq("id", attemptId)
      .single();

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    const { data: questions } = await supabase
      .from("questions")
      .select("*")
      .eq("assessment_id", attempt.assessment_id);

    let total = 0;
    const results = [];

    for (const q of questions) {
      const submitted = answers[q.id] ?? null;
      let correct = false;
      let awarded = 0;

      if (q.type === "mcq") {
        correct = String(submitted) === String(q.correct);
        if (correct) awarded = q.marks;
      }

      if (q.type === "short") {
        correct = normalizeStr(submitted) === normalizeStr(q.correct);
        if (correct) awarded = q.marks;
      }

      results.push({
        question_id: q.id,
        correct,
        submitted,
        marks_awarded: awarded,
      });

      total += awarded;
    }

    await supabase
      .from("assessment_attempts")
      .update({
        answers,
        score: total,
        status: "completed",
        completed_at: new Date().toISOString()
      })
      .eq("id", attemptId);

    return NextResponse.json({ total, results });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
