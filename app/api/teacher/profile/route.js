// app/api/teacher/profile/route.js  (App router server route)
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabaseClient";
import jwt from "jsonwebtoken";

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("auth-token")?.value ?? null;
}

export async function GET() {
  try {
    const token = await getToken();
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.userId;

    const { data: coach, error } = await supabase
      .from("coaches")
      .select("id, name, specialty, email, phone, location, coach_display_id, avatar, bio")
      .eq("id", userId)
      .maybeSingle();

    if (error) return NextResponse.json({ message: "Database error" }, { status: 500 });
    if (!coach) return NextResponse.json({ message: "Coach not found" }, { status: 404 });

    return NextResponse.json(coach);
  } catch {
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const token = await getToken();
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.userId;
    const body = await req.json();

    const updateData = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      specialty: body.specialty,
      location: body.location,
      // include avatar if present
      ...(body.avatar !== undefined ? { avatar: body.avatar } : {})
    };

    const { error } = await supabase.from("coaches").update(updateData).eq("id", userId);
    if (error) return NextResponse.json({ message: "Update failed", detail: error.message }, { status: 500 });

    return NextResponse.json({ message: "Updated" });
  } catch {
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
