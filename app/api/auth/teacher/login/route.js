// app/api/auth/teacher/login/route.js
import { supabase } from "@/lib/supabaseClient";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

function looksLikeBcryptHash(str) {
  return typeof str === "string" && /^\$2[aby]\$/.test(str);
}

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return Response.json({ message: "Email and password are required" }, { status: 400 });

    const { data: coach, error } = await supabase
      .from("coaches")
      .select("id, name, specialty, email, phone, location, password, coach_display_id")
      .ilike("email", email.toLowerCase())
      .maybeSingle();

    if (error) {
      console.error("Supabase fetch error:", error);
      return Response.json({ message: "An error occurred during login" }, { status: 500 });
    }
    if (!coach) return Response.json({ message: "Invalid credentials" }, { status: 401 });

    const stored = coach.password;
    if (!stored) return Response.json({ message: "Invalid credentials" }, { status: 401 });

    const isValid = looksLikeBcryptHash(stored)
      ? await bcrypt.compare(password, stored).catch(() => false)
      : password === stored;

    if (!isValid) return Response.json({ message: "Invalid credentials" }, { status: 401 });

    const token = jwt.sign({ userId: coach.id, email: coach.email, role: "coach" }, process.env.JWT_SECRET, { expiresIn: "24h" });

    // IMPORTANT: await cookies() (store)
    const cookieStore = await cookies();
    cookieStore.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60,
    });

    return Response.json({
      message: "Logged in successfully",
      user: {
        id: coach.id,
        name: coach.name,
        specialty: coach.specialty,
        email: coach.email,
        phone: coach.phone,
        location: coach.location,
        coachDisplayId: coach.coach_display_id,
        role: "coach",
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return Response.json({ message: "An error occurred during login" }, { status: 500 });
  }
}
