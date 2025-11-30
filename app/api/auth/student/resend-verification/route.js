
// app/api/auth/student/resend-verification/route.js
import { connectDB } from "@/lib/mongodb";
import Student from "@/models/Student";
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
    const student = await Student.findOne({ email: email.toLowerCase() });

    if (!student) {
      return Response.json({
        message: "If an account exists, a verification email will be sent."
      });
    }

    if (student.verified) {
      return Response.json(
        { message: "Email is already verified. Please login." },
        { status: 400 }
      );
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    student.verificationToken = verificationToken;
    student.verificationTokenExpires = verificationTokenExpires;
    await student.save();

    await sendVerificationEmail({
      email: student.email,
      name: `${student.firstName} ${student.lastName}`,
      token: verificationToken,
      role: 'student'
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
