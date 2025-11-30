// app/api/teacher/livestreams/route.js
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { supabase } from "@/lib/supabaseClient"; // adjust path to your supabase helper

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

export async function GET(request) {
  try {
    // get NextAuth token from the incoming request
    const token = await getToken({ req: request, secret: NEXTAUTH_SECRET });

    if (!token || !token.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const coachEmail = String(token.email).toLowerCase();

    // query supabase demo_classes table where coach contains coachEmail (case-insensitive)
    const { data, error } = await supabase
      .from("demo_classes")
      .select("*")
      .ilike("coach", `%${coachEmail}%`)
      .order("id", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message || "DB error" }, { status: 500 });
    }

    // Optionally, also fetch registration counts (example)
    // const classIds = (data || []).map(r => r.id);
    // const { data: regs, error: regErr } = await supabase
    //    .from("demo_registrations")
    //    .select("demo_class_id, count(id)")
    //    .in("demo_class_id", classIds)
    //    .group("demo_class_id");

    // build response
    return NextResponse.json({ demo_classes: data }, { status: 200 });
  } catch (err) {
    console.error("GET /api/teacher/livestreams error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
