
// app/api/auth/teacher/verify-token/route.js
import { connectDB } from "@/lib/mongodb";
import Teacher from "@/models/Teacher";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return Response.json(
        { message: "Verification token is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const teacher = await Teacher.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!teacher) {
      return Response.json(
        { message: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    teacher.verified = true;
    teacher.verificationToken = undefined;
    teacher.verificationTokenExpires = undefined;
    await teacher.save();

    return Response.json({
      message: "Email verified successfully",
      redirectUrl: "/auth/teacher/login?success=" + encodeURIComponent("Email verified successfully. You can now log in.")
    });
  } catch (error) {
    console.error("Verification error:", error);
    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
