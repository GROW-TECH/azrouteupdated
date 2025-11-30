// file: app/api/teacher/updateProgress/route.js
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

export async function PATCH(request) {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, progress_percentage, level, notes } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    // ensure the coach owns this progress row
    const { data: existing, error: fetchErr } = await supabase
      .from("student_progress")
      .select("id, coach_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr) {
      console.error("fetch existing error", fetchErr);
      return NextResponse.json({ error: "Failed to fetch record" }, { status: 500 });
    }
    if (!existing) return NextResponse.json({ error: "Record not found" }, { status: 404 });
    if (existing.coach_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // perform update
    const { data, error } = await supabase
      .from("student_progress")
      .update({
        progress_percentage,
        level,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("update error", error);
      return NextResponse.json({ error: "Failed to update", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Updated", data });
  } catch (err) {
    console.error("PATCH /api/teacher/updateProgress error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
