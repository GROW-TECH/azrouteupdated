// app/api/teacher/students/route.js
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// verify coach auth (same approach you used in courses route)
async function verifyAuth() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token");
    if (!token?.value) return null;

    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    if (decoded.role !== "coach") return null;

    const { data: coach, error } = await supabase
      .from("coaches")
      .select("id, name, email")
      .eq("id", decoded.userId)
      .maybeSingle();

    if (error || !coach) return null;
    return { id: coach.id, name: coach.name, email: coach.email };
  } catch (err) {
    console.error("verifyAuth error:", err);
    return null;
  }
}

export async function GET(request) {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 100);
    const status = searchParams.get("status") || null;
    const courseParam = searchParams.get("course") || null;

    const from = (page - 1) * limit;
    const to = page * limit - 1;

    // 1) collect course titles for this coach
    const titles = new Set();

    const { data: byId } = await supabase
      .from("course")
      .select("title")
      .eq("coach_id_int", user.id);

    if (Array.isArray(byId)) byId.forEach(r => r.title && titles.add(r.title));

    const { data: byName } = await supabase
      .from("course")
      .select("title")
      .ilike("coach_name", user.name);

    if (Array.isArray(byName)) byName.forEach(r => r.title && titles.add(r.title));

    if (courseParam) {
      const cp = courseParam.toString().trim().toLowerCase();
      const matched = Array.from(titles).find(t => t && t.toString().trim().toLowerCase() === cp)
        || Array.from(titles).find(t => t && t.toString().toLowerCase().includes(cp));
      if (matched) {
        titles.clear();
        titles.add(matched);
      } else {
        return NextResponse.json({ students: [], total: 0, page, limit });
      }
    }

    if (titles.size === 0) {
      return NextResponse.json({ students: [], total: 0, page, limit });
    }

    // 2) build OR condition for student_list course matches
    const conditions = Array.from(titles).map((t) => {
      const cleaned = String(t).trim();
      return `course.ilike.%${cleaned}%`;
    }).join(",");

    // 3) query student_list with exact DB values only (no injected fallbacks)
    let query = supabase
      .from("student_list")
      .select("*", { count: "exact" });

    query = query.or(conditions);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, count, error } = await query.range(from, to).order("id", { ascending: true });

    if (error) {
      console.error("Supabase students fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
    }

    // IMPORTANT: return DB rows exactly (no overrides)
    const students = data || [];

    return NextResponse.json({
      students,
      total: Number(count ?? students.length),
      page,
      limit,
    });
  } catch (err) {
    console.error("GET /api/teacher/students error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
