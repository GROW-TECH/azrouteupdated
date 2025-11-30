
// app/api/auth/teacher/logout/route.js
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookie = await cookies();
    cookie.delete("auth-token");
    return Response.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return Response.json(
      { message: "Failed to logout" },
      { status: 500 }
    );
  }
}
