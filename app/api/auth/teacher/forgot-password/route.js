
// app/api/auth/teacher/forgot-password/route.js
import { connectDB } from "@/lib/mongodb";
import Teacher from "@/models/Teacher";
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request) {
  try {
    await connectDB();
    const { email } = await request.json();

    if (!email) {
      return Response.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    const teacher = await Teacher.findOne({ email: email.toLowerCase() });

    // Generate reset token even if user doesn't exist (for security)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    if (teacher) {
      teacher.resetPasswordToken = resetToken;
      teacher.resetPasswordExpires = resetTokenExpires;
      await teacher.save();

      try {
        await sendPasswordResetEmail({
          email: teacher.email,
          name: `${teacher.firstName} ${teacher.lastName}`,
          token: resetToken,
          role: 'teacher'
        });
      } catch (emailError) {
        console.error('Failed to send reset email:', emailError);
        return Response.json(
          { message: "Failed to send reset email" },
          { status: 500 }
        );
      }
    }

    // Return same response whether user exists or not (for security)
    return Response.json({
      message: "If an account exists, password reset instructions will be sent to your email"
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return Response.json(
      { message: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
