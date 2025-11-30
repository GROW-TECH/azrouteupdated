
// app/api/auth/student/verify-token/route.js
import { connectDB } from "@/lib/mongodb";
import Student from "@/models/Student";

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

    const student = await Student.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!student) {
      return Response.json(
        { message: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    student.verified = true;
    student.verificationToken = undefined;
    student.verificationTokenExpires = undefined;
    await student.save();

    return Response.json({
      message: "Email verified successfully",
      redirectUrl: "/auth/student/login?success=" + encodeURIComponent("Email verified successfully. You can now log in.")
    });
  } catch (error) {
    console.error("Verification error:", error);
    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
