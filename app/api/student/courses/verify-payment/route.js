// app/api/student/courses/verify-payment/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import Stripe from "stripe";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Verify student
async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token");

  if (!token) return null;

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    const { data: student, error } = await supabase
      .from("Students")
      .select("id, name, email")
      .eq("id", decoded.userId)
      .single();

    if (error || !student) return null;

    return {
      id: student.id,
      email: student.email,
      name: student.name,
    };
  } catch (err) {
    console.error("Token verification error:", err);
    return null;
  }
}

export async function POST(request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const body = await request.json();
    const { sessionId, courseId } = body;

    // Retrieve Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session || session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    // Verify metadata matches
    if (session.metadata.courseId !== courseId || session.metadata.studentId !== user.id) {
      return NextResponse.json({ error: "Invalid payment session" }, { status: 400 });
    }

    // Get course details
    const { data: course, error: courseErr } = await supabase
      .from("Courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (courseErr || !course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from("CourseEnrollments")
      .select("*")
      .eq("studentId", user.id)
      .eq("courseId", courseId)
      .single();

    let enrollment = existingEnrollment;

    if (!enrollment) {
      // Create new enrollment
      const { data: newEnrollment, error: enrollErr } = await supabase
        .from("CourseEnrollments")
        .insert([
          {
            studentId: user.id,
            courseId: course.id,
            status: "active",
            paymentInfo: {
              amount: session.amount_total / 100, // Convert from cents
              currency: session.currency,
              stripeSessionId: session.id,
              stripePaymentIntentId: session.payment_intent,
              status: "completed",
              completedAt: new Date().toISOString(),
            },
          },
        ])
        .select()
        .single();

      if (enrollErr) throw enrollErr;
      enrollment = newEnrollment;
    }

    return NextResponse.json({
      message: "Payment verified successfully",
      course: {
        id: course.id,
        title: course.title,
      },
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
      },
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}
