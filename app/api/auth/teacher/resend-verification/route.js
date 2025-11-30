
// app/api/auth/teacher/resend-verification/route.js
import { connectDB } from "@/lib/mongodb";
import Teacher from "@/models/Teacher";
import { sendVerificationEmail } from "@/lib/email";
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return Response.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    await connectDB();
    const teacher = await Teacher.findOne({ email: email.toLowerCase() });

    if (!teacher) {
      return Response.json({
        message: "If an account exists, a verification email will be sent."
      });
    }

    if (teacher.verified) {
      return Response.json(
        { message: "Email is already verified. Please login." },
        { status: 400 }
      );
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    teacher.verificationToken = verificationToken;
    teacher.verificationTokenExpires = verificationTokenExpires;
    await teacher.save();

    await sendVerificationEmail({
      email: teacher.email,
      name: `${teacher.firstName} ${teacher.lastName}`,
      token: verificationToken,
      role: 'teacher'
    });

    return Response.json({
      message: "If an account exists, a verification email will be sent."
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return Response.json(
      { message: "Failed to send verification email" },
      { status: 500 }
    );
  }
}
