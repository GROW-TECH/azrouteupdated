// app/api/student/courses/purchase/route.js
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
    const { courseId, promoCode } = body;

    // Get course
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

    if (existingEnrollment) {
      return NextResponse.json({ error: "Already enrolled in this course" }, { status: 400 });
    }

    // Calculate price after promo code
    let finalPrice = course.price;
    if (promoCode) {
      const discount = await validatePromoCode(promoCode, courseId);
      if (discount) {
        finalPrice = course.price - (course.price * discount.percentage) / 100;
      }
    }

    // Free course: enroll directly
    if (finalPrice === 0) {
      const { data: enrollment, error: enrollErr } = await supabase
        .from("CourseEnrollments")
        .insert([
          {
            studentId: user.id,
            courseId: course.id,
            status: "active",
            paymentInfo: {
              amount: 0,
              status: "completed",
              completedAt: new Date().toISOString(),
            },
          },
        ])
        .select()
        .single();

      if (enrollErr) throw enrollErr;

      return NextResponse.json({
        message: "Successfully enrolled in course",
        enrollment,
      });
    }

    // Paid course: create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: course.title,
              description: course.description?.substring(0, 255),
              images: course.thumbnail ? [course.thumbnail] : undefined,
            },
            unit_amount: Math.round(finalPrice * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        courseId: course.id,
        studentId: user.id,
        studentEmail: user.email,
        studentName: user.name,
        promoCode: promoCode || "",
      },
      customer_email: user.email,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${courseId}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${courseId}/checkout?canceled=true`,
    });

    return NextResponse.json({
      sessionId: session.id,
      course: {
        id: course.id,
        title: course.title,
      },
    });
  } catch (error) {
    console.error("Course purchase error:", error);
    return NextResponse.json({ error: "Failed to process purchase" }, { status: 500 });
  }
}

// Validate promo code
async function validatePromoCode(code, courseId) {
  const { data: promoCode } = await supabase
    .from("PromoCodes")
    .select("*")
    .eq("code", code)
    .eq("courseId", courseId)
    .eq("status", "active")
    .gt("expiresAt", new Date().toISOString())
    .single();

  if (!promoCode) return null;

  return {
    percentage: promoCode.discountPercentage,
    code: promoCode.code,
  };
}
