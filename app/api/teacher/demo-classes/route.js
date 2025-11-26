// app/api/demo-classes/route.js
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

async function verifyCoach() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token");
    if (!token?.value) return null;

    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    if (decoded.role !== "coach") return null;

    const { data: coach } = await supabase
      .from("coaches")
      .select("id, name, email")
      .eq("id", decoded.userId)
      .maybeSingle();

    return coach || null;
  } catch (err) {
    console.error("verifyCoach:", err);
    return null;
  }
}

// helper — convert db date & "hh:mm AM/PM" into JS Date
function buildDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  try {
    const d = new Date(`${dateStr} ${timeStr}`);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export async function GET(request) {
  try {
    const coach = await verifyCoach();
    if (!coach) return NextResponse.json([], { status: 401 });

    const { data: classes, error: clsErr } = await supabase
      .from("demo_classes")
      .select("*")
      .ilike("coach", coach.name);

    if (clsErr || !classes) return NextResponse.json([]);

    const now = new Date();
    const out = [];

    for (const c of classes) {
      const classDateTime = buildDateTime(c.date, c.time);

      // ❌ skip past classes
      if (classDateTime && classDateTime < now) continue;

      const { count: registrations_count } = await supabase
        .from("demo_registrations")
        .select("*", { count: "exact", head: true })
        .eq("demo_class_id", c.id);

      out.push({
        id: c.id,
        title: c.title,
        coach: c.coach,
        date: c.date ?? null,
        time: c.time ?? null,
        duration: c.duration ?? null,
        level: c.level ?? null,
        description: c.description ?? null,
        course: c.course ?? null,
        meet_link: c.meet_link ?? null,
        registrations_count: registrations_count ?? 0,
      });
    }

    return NextResponse.json(out);
  } catch (err) {
    console.error("GET /api/demo-classes error:", err);
    return NextResponse.json([]);
  }
}
