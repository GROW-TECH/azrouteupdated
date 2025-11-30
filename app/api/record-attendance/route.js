// /app/api/record-attendance/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req) {
  try {
    if (!SUPABASE_URL || !SERVICE_KEY) {
      console.error("Missing Supabase env vars");
      return NextResponse.json(
        { error: "Server misconfiguration: missing Supabase env vars" },
        { status: 500 }
      );
    }

    const supaAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });

    const body = await req.json().catch(() => ({}));
    const { classId, email: bodyEmail } = body || {};

    if (!classId) {
      return NextResponse.json({ error: "classId is required" }, { status: 400 });
    }

    // Try to get server session (best effort)
    let email = null;
    try {
      const session = await getServerSession(authOptions);
      email = session?.user?.email ?? null;
    } catch (e) {
      // session fetch may fail in some setups — we'll fall back to bodyEmail below
      console.warn("getServerSession failed or unavailable:", e?.message || e);
    }

    // fallback: accept email from request body (useful when sendBeacon or client doesn't send cookies)
    if (!email && bodyEmail) email = bodyEmail;

    if (!email) {
      return NextResponse.json({ error: "Not authenticated: email missing" }, { status: 401 });
    }

    // find student by email
    const { data: student, error: studentErr } = await supaAdmin
      .from("student_list")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (studentErr) {
      console.error("student lookup error:", studentErr);
      return NextResponse.json({ error: "Failed to lookup student" }, { status: 500 });
    }
    if (!student) {
      return NextResponse.json({ error: "Student record not found" }, { status: 404 });
    }

    // find class row
    const { data: cls, error: classErr } = await supaAdmin
      .from("classlist")
      .select("id, class_name, date, time")
      .eq("id", classId)
      .maybeSingle();

    if (classErr) {
      console.error("class fetch error:", classErr);
      return NextResponse.json({ error: "Failed to lookup class" }, { status: 500 });
    }
    if (!cls) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const attendanceRow = {
      student_id: student.id,
      attendance_date: cls.date,
      status: "P", // mark present
      class_type: cls.class_name ? String(cls.class_name).slice(0, 50) : "class",
      class_list_id: cls.id,
      created_at: new Date().toISOString(),
    };

    // Try upsert first (onConflict on student+class)
    // Note: adjust onConflict columns to match your DB unique constraint if needed
    const { data: upsertData, error: upsertErr } = await supaAdmin
      .from("attendance")
      .upsert(attendanceRow, { onConflict: ["student_id", "class_list_id"] });

    if (upsertErr) {
      console.warn("upsert returned error:", upsertErr);

      // If duplicate-key (or other conflict), attempt safe UPDATE fallback
      // This will mark existing row as Present and update attendance_date/created_at
      try {
        const { data: upd, error: updErr } = await supaAdmin
          .from("attendance")
          .update({
            status: "P",
            attendance_date: cls.date,
            class_type: attendanceRow.class_type,
            created_at: new Date().toISOString(),
          })
          .eq("student_id", student.id)
          .eq("class_list_id", cls.id)
          .select()
          .maybeSingle();

        if (updErr) {
          console.error("attendance update fallback error:", updErr);
          return NextResponse.json({ error: "Failed to record attendance" }, { status: 500 });
        }

        // success via update fallback
        return NextResponse.json({ success: true, studentId: student.id, method: "updated" }, { status: 200 });
      } catch (uErr) {
        console.error("update fallback exception:", uErr);
        return NextResponse.json({ error: "Failed to record attendance (update fallback)" }, { status: 500 });
      }
    }

    // upsert succeeded
    return NextResponse.json({ success: true, studentId: student.id, method: "upserted" }, { status: 200 });
  } catch (err) {
    console.error("record-attendance error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
