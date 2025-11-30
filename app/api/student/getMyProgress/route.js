// app/api/student/getMyProgress/route.js
import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

async function verifyAuth() {
  const cookieStore = await cookies();

  // 1) Check for custom JWT (auth-token) or coach-token (existing flow)
  const authToken = cookieStore.get("auth-token")?.value ?? cookieStore.get("coach-token")?.value ?? null;
  if (authToken) {
    try {
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
      return { id: decoded.userId, role: decoded.role ?? null };
    } catch (err) {
      console.error("Auth verify error (JWT):", err);
      return null;
    }
  }

  // 2) No custom JWT — try NextAuth session cookie for student
  const nextAuthSecure = cookieStore.get("__Secure-next-auth.session-token")?.value ?? null;
  const nextAuthPlain = cookieStore.get("next-auth.session-token")?.value ?? null;
  const nextAuthToken = nextAuthSecure ?? nextAuthPlain;

  if (!nextAuthToken) return null;

  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const sessionRes = await fetch(`${baseUrl}/api/auth/session`, {
      headers: {
        // send the next-auth cookie so NextAuth can read the session
        cookie: `${nextAuthSecure ? `__Secure-next-auth.session-token=${nextAuthSecure}` : `next-auth.session-token=${nextAuthPlain}`}`,
      },
    });

    if (!sessionRes.ok) {
      console.error("NextAuth session fetch failed:", await sessionRes.text());
      return null;
    }

    const sessionJson = await sessionRes.json();
    const email = sessionJson?.user?.email ?? null;
    if (!email) return null;

    // lookup student by email in student_list
    const { data: student, error } = await supabase
      .from("student_list")
      .select("id")
      .ilike("email", email.toLowerCase())
      .maybeSingle();

    if (error) {
      console.error("Supabase error (student_list lookup):", error);
      return null;
    }
    if (!student) return null;

    return { id: student.id, role: "student" };
  } catch (err) {
    console.error("Auth verify error (NextAuth):", err);
    return null;
  }
}

export async function GET(request) {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const qStudentId = url.searchParams.get("student_id");
    const studentId = qStudentId ? Number(qStudentId) : Number(user.id);

    if (!studentId) return NextResponse.json({ progress: [] });

    // If requester is a coach and provided student_id, verify coach owns it (optional)
    if (user.role === "coach" && qStudentId) {
      const { data: check, error: checkErr } = await supabase
        .from("student_progress")
        .select("id")
        .eq("student_id", studentId)
        .eq("coach_id", user.id)
        .limit(1);

      if (checkErr) {
        console.error("Ownership check failed", checkErr);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
      }
      // (If you want coaches to view any student, remove the above check.)
    }

    // fetch progress rows; include coach relation if available
    const { data, error } = await supabase
      .from("student_progress")
      .select("id, student_id, progress_percentage, level, notes, created_at, updated_at, coaches (id, name), coach_id")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching progress:", error);
      return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
    }

    const progress = (data || []).map((r) => ({
      id: r.id,
      student_id: r.student_id,
      progress_percentage: r.progress_percentage,
      level: r.level,
      notes: r.notes,
      created_at: r.created_at,
      updated_at: r.updated_at,
      coach_id: r.coach_id ?? r.coaches?.id ?? null,
      coach_name: r.coaches?.name ?? null,
    }));

    return NextResponse.json({ progress });
  } catch (err) {
    console.error("GET /api/student/getMyProgress error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
