import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token");
  if (!token?.value) return null;
  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    if (decoded.role !== "coach") return null;

    const { data: coach, error } = await supabase
      .from("coaches")
      .select("id, name, email")
      .eq("id", decoded.userId)
      .maybeSingle();

    if (error || !coach) return null;
    return { id: coach.id, name: coach.name, email: coach.email, role: "coach" };
  } catch (err) {
    console.error("Auth verify error:", err);
    return null;
  }
}

export async function GET(request) {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const assessmentId = searchParams.get("assessment_id"); // optional filter

    let query = supabase
      .from("assessment_attempts")
      .select("id, assessment_id, student_email, student_id, started_at, completed_at, answers, score, status")
      .order("completed_at", { ascending: false });

    if (assessmentId) query = query.eq("assessment_id", Number(assessmentId));

    const { data: attempts, error } = await query;
    if (error) {
      console.error("Failed to load attempts:", error);
      return NextResponse.json({ error: "Failed to load attempts" }, { status: 500 });
    }

    return NextResponse.json({ attempts: attempts || [] });
  } catch (err) {
    console.error("GET /api/teacher/assessment_attempts error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
