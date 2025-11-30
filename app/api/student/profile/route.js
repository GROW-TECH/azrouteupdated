// app/api/student/profile/route.js
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { supabase } from "@/lib/supabaseClient";

const AUTH_COOKIE = "token";

async function getStudentFromToken() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE)?.value;
    if (!token) return null;

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET is missing");
      return null;
    }

    const decoded = jwt.verify(token, secret);
    if (!decoded?.id) return null;

    // Query the student_list table (your provided schema)
    const { data: student, error } = await supabase
      .from("student_list")
      .select(
        "id, reg_no, name, dob, email, phone, place, class_type, group_name, course, level, avatar"
      )
      .eq("id", decoded.id)
      .single();

    if (error || !student) {
      console.error("Supabase fetch error (student_list):", error);
      return null;
    }

    // Normalize for frontend
    return {
      id: student.id,
      reg_no: student.reg_no ?? null,
      Student_name: student.name ?? "",
      dob: student.dob ?? null,
      email: student.email ?? null,
      mobile: student.phone ?? null,
      location: student.place ?? null,
      class_type: student.class_type ?? null,
      group_name: student.group_name ?? null,
      course: student.course ?? null,
      level: student.level ?? null,
      avatar: student.avatar ?? null, // optional column you can add
    };
  } catch (err) {
    console.error("getStudentFromToken error:", err?.message || err);
    return null;
  }
}

// GET /api/student/profile
export async function GET() {
  const student = await getStudentFromToken();
  if (!student) {
    return new Response(JSON.stringify({ message: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(student), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// PUT /api/student/profile
export async function PUT(request) {
  const student = await getStudentFromToken();
  if (!student) {
    return new Response(JSON.stringify({ message: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();

    // require name (maps to 'name' column)
    if (!body?.Student_name || !String(body.Student_name).trim()) {
      return new Response(JSON.stringify({ message: "Name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // build update payload mapping frontend keys -> DB columns
    const updatePayload = {};
    if (typeof body.Student_name !== "undefined")
      updatePayload.name = body.Student_name;
    if (typeof body.email !== "undefined") updatePayload.email = body.email;
    if (typeof body.mobile !== "undefined") updatePayload.phone = body.mobile;
    if (typeof body.location !== "undefined") updatePayload.place = body.location;
    if (typeof body.course !== "undefined") updatePayload.course = body.course;
    if (typeof body.level !== "undefined") updatePayload.level = body.level;
    // avatar support: frontend may send { profile: { avatar: url } } or avatar directly
    if (typeof body.profile !== "undefined" && body.profile?.avatar) {
      updatePayload.avatar = body.profile.avatar;
    }
    if (typeof body.avatar !== "undefined") updatePayload.avatar = body.avatar;

    // perform update on student_list using id
    const { data, error } = await supabase
      .from("student_list")
      .update(updatePayload)
      .eq("id", student.id)
      .select()
      .single();

    if (error) throw error;

    // normalize returned row
    const normalized = {
      id: data.id,
      reg_no: data.reg_no ?? null,
      Student_name: data.name ?? "",
      dob: data.dob ?? null,
      email: data.email ?? null,
      mobile: data.phone ?? null,
      location: data.place ?? null,
      class_type: data.class_type ?? null,
      group_name: data.group_name ?? null,
      course: data.course ?? null,
      level: data.level ?? null,
      avatar: data.avatar ?? null,
    };

    return new Response(JSON.stringify(normalized), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("PUT /api/student/profile error:", err);
    return new Response(
      JSON.stringify({ message: err?.message || "Failed to update profile" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}
