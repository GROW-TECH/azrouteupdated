// app/api/teacher/liveclasses/route.js
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

async function verifyAuth() {
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
    console.error("verifyAuth:", err);
    return null;
  }
}

// parse date + time
function parseDateTime(dateStr, timeStr) {
  const full = `${dateStr} ${timeStr}`;
  const d = new Date(full);
  return isNaN(d.getTime()) ? null : d;
}

export async function GET(request) {
  try {
    const coach = await verifyAuth();
    if (!coach)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const showPast = url.searchParams.get("show_past") === "1";

    // fetch classes assigned to the coach
    const { data: classes } = await supabase
      .from("classlist")
      .select("*")
      .ilike("coach", `%${coach.name}%`);

    if (!classes) return NextResponse.json({ classes: [] });

    const now = new Date();
    const upcomingClasses = [];

    for (const c of classes) {
      const dt = parseDateTime(c.date, c.time);

      if (dt && !showPast && dt < now) continue; // filter expired

      // count participants from student_list (course = class_name)
      const { count: studentCount } = await supabase
        .from("student_list")
        .select("*", { count: "exact", head: true })
        .eq("course", c.class_name);

      upcomingClasses.push({
        id: c.id,
        title: c.class_name,
        course: c.class_name,
        date: c.date,
        time: c.time,
        duration: c.time,
        level: c.level,
        description: c.description,
        meet_link: c.meet_link,
        participants_count: studentCount ?? 0,
        start_at: dt ? dt.toISOString() : null,
      });
    }

    return NextResponse.json({ classes: upcomingClasses });
  } catch (err) {
    console.error("GET liveclasses:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
