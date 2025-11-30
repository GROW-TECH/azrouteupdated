import { supabase } from "@/lib/supabaseClient"; // Your Supabase client
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// Function to verify the coach's authentication
async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token");
  if (!token?.value) return null;
  
  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    if (decoded.role !== "coach") return null;

    const { data: coach, error } = await supabase
      .from("coaches")
      .select("id, name, email")
      .eq("id", decoded.userId)
      .maybeSingle();

    if (error || !coach) return null;
    return { id: coach.id, name: coach.name, email: coach.email, role: "coach" };
  } catch (err) {
    console.error("Auth verify error:", err);
    return null;
  }
}

export async function POST(request) {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get the data from the request body
    const { student_id, progress_percentage, level, notes } = await request.json();

    console.log("Received data:", { student_id, progress_percentage, level, notes });

    // Validate the required fields
    if (!student_id || progress_percentage === undefined || !level) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Insert the progress data into the database
    const { data, error } = await supabase
      .from("student_progress")
      .insert([
        {
          student_id,
          coach_id: user.id,
          progress_percentage,
          level,
          notes,
        },
      ]);

    if (error) {
      console.error("Error inserting progress:", error);
      return NextResponse.json({ error: "Failed to add progress", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Progress added successfully", data });
  } catch (err) {
    console.error("POST /api/teacher/addProgress error:", err);
    return NextResponse.json({ error: "Server error", details: err.message }, { status: 500 });
  }
}


