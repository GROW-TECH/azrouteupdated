// file: app/api/teacher/getManualProgress/route.js (or wherever you placed it)
import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";
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

    // fetch with related student_list to get name, order by newest
    const { data, error } = await supabase
      .from("student_progress")
      .select("id, student_id, progress_percentage, level, notes, created_at, student_list (id, name)")
      .eq("coach_id", user.id)
      .order("id", { ascending: false }); // newest first

    if (error) {
      console.error("Error fetching manual progress:", error);
      return NextResponse.json({ error: "Failed to fetch manual progress" }, { status: 500 });
    }

    // dedupe by student_id, keep the first (newest) record per student
    const seen = new Map();
    for (const row of (data || [])) {
      if (!seen.has(row.student_id)) {
        seen.set(row.student_id, {
          id: row.id,
          student_id: row.student_id,
          student_name: row.student_list?.name ?? null,
          progress_percentage: row.progress_percentage,
          level: row.level,
          notes: row.notes,
          created_at: row.created_at,
        });
      }
    }
    const manualProgress = Array.from(seen.values());

    return NextResponse.json({ manualProgress });
  } catch (err) {
    console.error("GET /api/teacher/getManualProgress error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
