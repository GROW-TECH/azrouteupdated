"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Button } from "../../../components/ui/button";
import { Alert, AlertDescription } from "../../../components/ui/alert";

// If you were using AuthContext to store student info, you can keep it, but NextAuth is the source of truth.
import { useAuth } from "../../../context/AuthContext";

export default function StudentLoginPage() {
  const router = useRouter();
  const { setStudent } = useAuth(); // optional: we'll update this after signIn if you still need it
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Use NextAuth signIn with credentials provider
      const res = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
        role: "student", // keep role fixed for this page
      });

      // res structure: { error, status, ok, url }
      if (res?.ok) {
        // Optionally, you can fetch session or set your AuthContext
        // But simply redirecting is often enough because SessionProvider will pick up the session
        // If you want to also set your AuthContext (legacy), you could fetch /api/auth/session here and setStudent(...)
        router.push("/dashboard/student/courses");
      } else {
        // signIn failed
        setError(res?.error || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 flex items-center justify-center min-h-[calc(100vh-5rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Student Login</CardTitle>
          <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </Button>

            <div className="text-center text-sm">
              Don't have an account?{" "}
              <Link href="/auth/student/signup" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
