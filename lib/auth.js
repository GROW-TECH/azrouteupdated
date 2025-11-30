// lib/auth.js
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth";
import { supabase } from "@/lib/supabaseClient"; // your existing supabase client
import bcrypt from "bcryptjs";
import { authOptions as exportedAuthOptionsPlaceholder } from "next-auth"; // placeholder import type hint (no runtime effect)

/**
 * NOTE:
 * - This file uses your Supabase client (import from "@/lib/supabaseClient").
 * - It expects two tables (or similar) for users:
 *     - "student_list" (columns: id, name, email, password, verified, avatar, ...)
 *     - "teacher_list" (columns: id, name, email, password, verified, avatar, ...)
 *   Adjust table/column names below if your schema differs.
 */

// ---------- NextAuth options (Credentials provider) ----------
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.role) {
          throw new Error("Missing credentials");
        }

        try {
          const role = credentials.role === "student" ? "student" : "teacher";
          const table = role === "student" ? "student_list" : "teacher_list";

          // fetch user row by email
          const { data: user, error } = await supabase
            .from(table)
            .select("id, name, email, password, verified, avatar")
            .eq("email", credentials.email)
            .maybeSingle();

          if (error) {
            console.error("Supabase fetch error:", error);
            throw new Error("Failed to lookup user");
          }
          if (!user) {
            throw new Error("No user found with this email");
          }

          // Compare hashed password (assuming you store bcrypt hash)
          const isValid = await bcrypt.compare(credentials.password, user.password || "");
          if (!isValid) {
            throw new Error("Invalid password");
          }

          if (!user.verified) {
            throw new Error("Please verify your email first");
          }

          // return the minimal profile for next-auth
          return {
            id: user.id?.toString?.() ?? String(user.id),
            name: user.name,
            email: user.email,
            role,
            avatar: user.avatar || null,
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw new Error(error?.message || "Authentication failed");
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
        token.avatar = user.avatar;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        // Ensure session.user exists
        session.user = session.user || {};
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.avatar = token.avatar;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },

  secret: process.env.NEXTAUTH_SECRET,
};

// ---------- JWT cookie helpers ----------
export async function getAuthToken() {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("auth-token");
    if (!tokenCookie) return null;

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not set");
      return null;
    }

    const decoded = jwt.verify(tokenCookie.value, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error("Auth token error:", error);
    return null;
  }
}

// ---------- Supabase-based user helpers ----------
export async function getAuthUser() {
  try {
    const token = await getAuthToken();
    if (!token) return null;

    const role = token.role === "student" ? "student" : "teacher";
    const table = role === "student" ? "student_list" : "teacher_list";
    const userId = token.userId || token.user_id || token.id;

    if (!userId) return null;

    const { data: user, error } = await supabase
      .from(table)
      .select("id, name, email, verified, avatar")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Supabase getAuthUser error:", error);
      return null;
    }
    if (!user) return null;

    return {
      ...user,
      id: user.id?.toString?.() ?? String(user.id),
      role,
    };
  } catch (error) {
    console.error("Get auth user error:", error);
    return null;
  }
}

// ---------- verifyAuth for API routes (throws on failure) ----------
export async function verifyAuth(request) {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const role = token.role === "student" ? "student" : "teacher";
    const table = role === "student" ? "student_list" : "teacher_list";
    const userId = token.userId || token.user_id || token.id;

    if (!userId) throw new Error("Invalid token (missing user id)");

    const { data: user, error } = await supabase
      .from(table)
      .select("id, verified")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("verifyAuth supabase error:", error);
      throw new Error("Authentication failed");
    }
    if (!user) throw new Error("User not found");
    if (!user.verified) throw new Error("Email not verified");

    return {
      userId: user.id,
      role,
    };
  } catch (error) {
    // Keep the thrown error message generic for security if desired
    console.error("verifyAuth error:", error);
    throw new Error("Authentication failed");
  }
}

// ---------- Role check ----------
export function checkRole(user, allowedRoles) {
  if (!user || !user.role) return false;
  return allowedRoles.includes(user.role);
}

// ---------- JWT generation ----------
export function generateToken(userId, role) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }

  return jwt.sign({ userId, role }, process.env.JWT_SECRET /*, { expiresIn: '24h' }*/);
}

// ---------- Auth error wrapper ----------
export function handleAuthError(error) {
  console.error("Auth error:", error);
  return {
    error: error?.message || "Authentication failed",
    status: error?.message?.toLowerCase?.().includes("not found") ? 404 : 401,
  };
}
