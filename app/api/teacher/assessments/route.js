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
    const courseFilter = (searchParams.get("course") || "").trim();

    // 1) fetch assessments (optionally filter by course/level if you want)
    let q = supabase.from("assessments").select("*").order("id", { ascending: false });
    if (courseFilter) q = q.ilike("course", `%${courseFilter}%`);

    const { data: assessments, error: assErr } = await q;
    if (assErr) {
      console.error("Failed to load assessments:", assErr);
      return NextResponse.json({ error: "Failed to load assessments" }, { status: 500 });
    }

    // 2) for each assessment fetch completed attempts count (supabase head query)
    // Note: this is N+1 but simple; if you need performance, use a RPC or a single SQL view.
    const out = [];
    for (const a of assessments || []) {
      const { count, error: cntErr } = await supabase
        .from("assessment_attempts")
        .select("*", { count: "exact", head: true })
        .eq("assessment_id", a.id)
        .eq("status", "completed");

      if (cntErr) {
        console.warn("Count error for assessment", a.id, cntErr);
      }

      out.push({
        id: a.id,
        course: a.course,
        date: a.date,
        total_marks: a.total_marks ?? a.total ?? null,
        level: a.level,
        duration: a.duration ?? null,
        start_time: a.start_time ?? null,
        end_time: a.end_time ?? null,
        attempts_count: Number(count ?? 0),
      });
    }

    return NextResponse.json({ assessments: out });
  } catch (err) {
    console.error("GET /api/teacher/assessments error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
