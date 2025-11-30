// app/api/auth/check/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { supabase } from "@/lib/supabaseClient";

function normalizeCoach(coach) {
  return {
    id: coach.id?.toString?.() ?? null,
    name: coach.name ?? null,
    firstName: null,
    middleName: null,
    lastName: null,
    email: coach.email ?? null,
    username: coach.email ?? null,
    preferredContactNumber: coach.phone ?? null,
    verified: true,
    role: "coach",
    profile: {
      avatar: null,
      bio: null,
      location: coach.location ?? null,
      website: null,
      education: [],
      skills: [],
      socialLinks: { linkedin: null, github: null, twitter: null },
    },
    specialty: coach.specialty ?? null,
    coachDisplayId: coach.coach_display_id ?? null,
  };
}

function normalizeStudent(student) {
  return {
    id: student.id?.toString?.() ?? null,
    name: student.name ?? student.Student_name ?? null,
    firstName: student.firstName ?? null,
    lastName: student.lastName ?? null,
    email: student.email ?? null,
    username: student.username ?? null,
    preferredContactNumber: student.preferredContactNumber ?? null,
    verified: !!student.verified,
    role: "student",
    profile: {
      avatar: student.profile?.avatar ?? null,
      bio: student.profile?.bio ?? null,
      location: student.profile?.location ?? null,
      website: student.profile?.website ?? null,
      education: student.profile?.education ?? [],
      skills: student.profile?.skills ?? [],
      socialLinks: student.profile?.socialLinks ?? { linkedin: null, github: null, twitter: null },
    },
    subjectsOfInterest: student.subjectsOfInterest ?? [],
  };
}

export async function GET() {
  try {
    const cookieStore = await cookies();

    // get tokens separately — do NOT mix NextAuth token with your JWT verify
    const customAuthToken = cookieStore.get("auth-token");       // your JWT for students (if used)
    const coachToken = cookieStore.get("coach-token");           // your JWT for coaches (if used)
    const nextAuthSecure = cookieStore.get("__Secure-next-auth.session-token");
    const nextAuthPlain = cookieStore.get("next-auth.session-token");

    // If no custom tokens, try NextAuth session (student)
    if (!customAuthToken?.value && !coachToken?.value) {
      const nextAuthValue = nextAuthSecure?.value ?? nextAuthPlain?.value ?? null;
      if (nextAuthValue) {
        try {
          const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
          // call NextAuth session endpoint server-side, sending the cookie value
          const sessionRes = await fetch(`${baseUrl}/api/auth/session`, {
            headers: {
              cookie: nextAuthSecure?.value
                ? `__Secure-next-auth.session-token=${nextAuthSecure.value}`
                : `next-auth.session-token=${nextAuthPlain.value}`,
            },
          });

          if (!sessionRes.ok) {
            // session endpoint rejected the session
            return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
          }

          const sessionJson = await sessionRes.json();
          const userEmail = sessionJson?.user?.email ?? null;
          if (!userEmail) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

          // lookup student by email
          const { data: student, error } = await supabase
            .from("student_list")
            .select("*")
            .ilike("email", userEmail.toLowerCase())
            .maybeSingle();

          if (error) {
            console.error("Supabase error (student_list via nextauth):", error);
            return NextResponse.json({ message: "Auth check failed" }, { status: 500 });
          }
          if (!student) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

          return NextResponse.json({ user: normalizeStudent(student) }, { status: 200 });
        } catch (err) {
          console.error("NextAuth session fetch error:", err);
          return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
        }
      }

      // no tokens at all
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    // Use JWT flow when we have a custom token
    const jwtToken = customAuthToken?.value ? customAuthToken.value : coachToken?.value ? coachToken.value : null;

    if (!jwtToken) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);
    } catch (err) {
      console.error("Token verification error:", err);
      if (err?.name === "TokenExpiredError") {
        const cs = await cookies();
        cs.delete("auth-token");
        cs.delete("coach-token");
        return NextResponse.json({ message: "Token expired", code: "TOKEN_EXPIRED" }, { status: 401 });
      }
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const role = (decoded.role || "").toString().toLowerCase();
    const userId = decoded.userId ?? decoded.id ?? null;
    const userEmail = decoded.email ?? null;

    if (role === "coach" || role === "teacher") {
      let query = supabase.from("coaches").select("id, name, specialty, email, phone, location, coach_display_id");
      if (userId) query = query.eq("id", Number(userId));
      else if (userEmail) query = query.ilike("email", userEmail.toLowerCase());

      const { data: coach, error } = await query.maybeSingle();
      if (error) {
        console.error("Supabase error (coaches):", error);
        return NextResponse.json({ message: "Auth check failed" }, { status: 500 });
      }
      if (!coach) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

      return NextResponse.json({ user: normalizeCoach(coach) }, { status: 200 });
    }

    if (role === "student") {
      let query = supabase.from("student_list").select("*");
      if (userId) query = query.eq("id", Number(userId));
      else if (userEmail) query = query.ilike("email", userEmail.toLowerCase());

      const { data: student, error } = await query.maybeSingle();
      if (error) {
        console.error("Supabase error (student_list):", error);
        return NextResponse.json({ message: "Auth check failed" }, { status: 500 });
      }
      if (!student) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

      return NextResponse.json({ user: normalizeStudent(student) }, { status: 200 });
    }

    return NextResponse.json({ message: "Invalid user role" }, { status: 401 });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ message: "Authentication failed" }, { status: 401 });
  }
}
