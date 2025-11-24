// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcryptjs";

function looksLikeBcryptHash(str) {
  return typeof str === "string" && /^\$2[aby]\$/.test(str);
}

async function fetchUserFromTable(email, table) {
  const { data: user, error } = await supabase
    .from(table)
    .select("*")
    .ilike("email", email.toLowerCase())
    .maybeSingle();
  if (error) {
    console.error(`Supabase fetch error from ${table}:`, error);
  }
  return user ?? null;
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" }, // "student" | "teacher" (staff)
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.role) {
          throw new Error("Missing email/password/role");
        }

        let user = null;
        const roleRequested = credentials.role?.toLowerCase();

        if (roleRequested === "student") {
          user = await fetchUserFromTable(credentials.email, "student_list");
        } else if (roleRequested === "teacher" || roleRequested === "staff" || roleRequested === "coach") {
          // IMPORTANT: for staff/teacher logins we ONLY check coaches table (per your request)
          user = await fetchUserFromTable(credentials.email, "coaches");
        } else {
          // fallback: try student first, then coaches
          user = (await fetchUserFromTable(credentials.email, "student_list")) || (await fetchUserFromTable(credentials.email, "coaches"));
        }

        if (!user) {
          throw new Error("No user found with this email");
        }

        const stored = user.password;
        if (!stored) {
          console.warn("User has no password field set", { email: credentials.email });
          throw new Error("Invalid password");
        }

        let isPasswordValid = false;
        if (looksLikeBcryptHash(stored)) {
          try {
            isPasswordValid = await bcrypt.compare(credentials.password, stored);
          } catch (e) {
            console.error("bcrypt.compare error", e);
            isPasswordValid = false;
          }
        } else {
          isPasswordValid = credentials.password === stored;
        }

        if (!isPasswordValid) {
          console.warn("Invalid password attempt for", credentials.email);
          throw new Error("Invalid password");
        }

        // normalize fields
        const id = user.id ?? user.Student_id ?? user.student_id ?? user.coach_display_id ?? null;
        const name =
          user.name ??
          [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ") ??
          user.Student_name ??
          user.student_name ??
          "";

        // Resolve role: if authenticated from coaches table, set role to 'coach'
        const resolvedRole = (user && user.coach_display_id) ? "coach" : roleRequested === "student" ? "student" : (roleRequested === "teacher" ? "teacher" : roleRequested);

        return {
          id,
          email: user.email,
          name,
          role: resolvedRole,
        };
      },
    }),
  ],

  pages: { signIn: "/auth/login", error: "/auth/error" },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? token.id;
        token.role = user.role ?? token.role;
        token.email = user.email ?? token.email;
        token.name = user.name ?? token.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = session.user || {};
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.email = token.email ?? session.user.email;
        session.user.name = token.name ?? session.user.name;
      }
      return session;
    },
  },

  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
  logger: {
    error(code, ...metadata) {
      console.error("NextAuth error", code, metadata);
    },
    warn(code) {
      console.warn("NextAuth warn", code);
    },
    debug(code, ...metadata) {
      if (process.env.NEXTAUTH_DEBUG === "true") {
        console.debug("NextAuth debug", code, metadata);
      }
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
