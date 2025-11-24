// app/api/teacher/students/route.js
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const UPLOADED_AVATAR = "/mnt/data/57a37dda-71e8-4e2b-bfa9-294fca3fb3e9.png"; // fallback avatar path

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
    // optional: explicit course param to restrict to a single course title
    const courseParam = searchParams.get("course") || null;

    const from = (page - 1) * limit;
    const to = page * limit - 1;

    // 1) get course titles for this coach (by coach_id_int and by coach_name fallback)
    const titles = new Set();

    // try matching by numeric coach id (preferred)
    const { data: byId } = await supabase
      .from("course")
      .select("title")
      .eq("coach_id_int", user.id);

    if (Array.isArray(byId)) byId.forEach(r => r.title && titles.add(r.title));

    // also include any courses where coach_name equals/ilike coach name
    const { data: byName } = await supabase
      .from("course")
      .select("title")
      .ilike("coach_name", user.name);

    if (Array.isArray(byName)) byName.forEach(r => r.title && titles.add(r.title));

    // If client passed specific course param, ensure it's used (still limited to coach's courses)
    if (courseParam) {
      // attempt to match courseParam to one of the coach's titles, case-insensitively
      const cp = courseParam.toString().trim().toLowerCase();
      const matched = Array.from(titles).find(t => t && t.toString().trim().toLowerCase() === cp)
        || Array.from(titles).find(t => t && t.toString().toLowerCase().includes(cp));
      if (matched) {
        // replace set with only matched value
        titles.clear();
        titles.add(matched);
      } else {
        // not one of this coach's courses -> return empty result
        return NextResponse.json({ students: [], total: 0, page, limit });
      }
    }

    // If coach has no courses, return empty list
    if (titles.size === 0) {
      return NextResponse.json({ students: [], total: 0, page, limit });
    }

    // 2) build supabase .or() query string for student_list course matches
    //    format: course.ilike.%title1% , course.ilike.%title2%
    const conditions = Array.from(titles).map((t) => {
      // basic sanitize: escape double quotes and trim
      const cleaned = String(t).trim();
      return `course.ilike.%${cleaned}%`;
    }).join(",");

    // 3) query student_list with the OR of ilike conditions
    let query = supabase
      .from("student_list")
      .select("*", { count: "exact" });

    // apply the OR condition
    query = query.or(conditions);

    // status filter (optional)
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    // pagination + order
    const { data, count, error } = await query.range(from, to).order("id", { ascending: true });

    if (error) {
      console.error("Supabase students fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
    }

    const students = (data || []).map((s) => ({
      ...s,
      avatar: s.avatar || UPLOADED_AVATAR,
    }));

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
