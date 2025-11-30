
// app/api/auth/teacher/reset-password/route.js
import { connectDB } from "@/lib/mongodb";
import Teacher from "@/models/Teacher";

const SPECIAL_CHARS = '!@#$%^&*(),.?{}';

export async function POST(request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return Response.json(
        { message: "Token and password are required" },
        { status: 400 }
      );
    }

    // Validate password requirements
    const passwordValidation = {
      length: password.length >= 10,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      special: new RegExp(`[${SPECIAL_CHARS}]`).test(password)
    };

    if (!Object.values(passwordValidation).every(Boolean)) {
      return Response.json(
        { message: "Password must be at least 10 characters long and contain at least one uppercase letter, one lowercase letter, and one special character" },
        { status: 400 }
      );
    }

    await connectDB();

    const teacher = await Teacher.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!teacher) {
      return Response.json(
        { message: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    teacher.password = password;
    teacher.resetPasswordToken = undefined;
    teacher.resetPasswordExpires = undefined;
    await teacher.save();

    return Response.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error('Reset password error:', error);
    return Response.json(
      { message: "Failed to reset password" },
      { status: 500 }
    );
  }
}
