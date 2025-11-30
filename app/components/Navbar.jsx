"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Bell, Menu, ChevronDown, LogOut, BookOpen, GraduationCap, Globe } from "lucide-react";

import { useSession, signOut } from "next-auth/react";
import { useAuth } from "../context/AuthContext";

/**
 * Navbar: unchanged student behavior. Adds teacher detection by:
 *  - preferring NextAuth session (if role is teacher will act as teacher)
 *  - otherwise calling /api/auth/check (credentials included) to detect legacy teacher cookie
 *
 * Note: `/api/auth/check` must return { user: { role, name, email, ... } } for teacher detection to work.
 */

export function Navbar() {
  const router = useRouter();
  const { student: ctxUser, setStudent } = useAuth?.() ?? {};
  const { data: session, status } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);

  // teacherUser holds server-cookie-based teacher/coach session (legacy)
  const [teacherUser, setTeacherUser] = useState(null);
  const [checkingLegacy, setCheckingLegacy] = useState(false);

  // Sync NextAuth session into AuthContext (unchanged)
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      try {
        setStudent?.(session.user);
        localStorage.setItem("studentSession", JSON.stringify(session.user));
      } catch (e) {}
    } else if (status === "unauthenticated") {
      setStudent?.(null);
      try {
        localStorage.removeItem("studentSession");
      } catch (e) {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user]);

  // Attempt to detect legacy teacher/coach cookie session when NextAuth isn't a teacher
  useEffect(() => {
    let mounted = true;
    // If nextauth session is teacher, no need to call legacy endpoint
    if (session?.user?.role === "teacher" || session?.user?.role === "coach") return;

    // Only call once when not authenticated by NextAuth
    (async () => {
      setCheckingLegacy(true);
      try {
        const res = await fetch("/api/auth/check", {
          method: "GET",
          credentials: "include",
        });
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          if (data?.user && (data.user.role === "teacher" || data.user.role === "coach")) {
            // normalise name/email fields for UI
            const name =
              [data.user.firstName, data.user.middleName, data.user.lastName].filter(Boolean).join(" ") ||
              data.user.name ||
              data.user.email;
            setTeacherUser({
              ...data.user,
              name,
            });
          }
        }
      } catch (err) {
        console.error("legacy auth check failed", err);
      } finally {
        if (mounted) setCheckingLegacy(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [session]);

  // Scroll shadow effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Logout: try NextAuth then legacy logout if needed
  const handleLogout = async () => {
    try {
      // If teacherUser exists (legacy), call legacy logout first
      if (teacherUser) {
        await fetch("/api/auth/teacher/logout", { method: "POST", credentials: "include" }).catch(() => {});
        setTeacherUser(null);
      }

      // Always try signOut to clear NextAuth session (if any)
      await signOut({ redirect: false });
      setStudent?.(null);
      localStorage.removeItem("studentSession");
      router.push("/");
    } catch (err) {
      console.error("logout failed", err);
      // fallback redirect
      router.push("/");
    }
  };

  // Decide which user to show in UI:
  // Prefer NextAuth session user (students mainly). If session role is teacher/coach, prefer that.
  // Otherwise, use teacherUser detected from legacy cookie.
  const nextAuthUser = session?.user ?? null;
  const isNextAuthTeacher = nextAuthUser?.role === "teacher" || nextAuthUser?.role === "coach";
  const user = isNextAuthTeacher ? nextAuthUser : teacherUser ?? (ctxUser || null);

  // Helpers
  const getUserInitials = () => {
    if (!user || !user.name) return "AZ";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Navigation items: keep student default unchanged, add teacher menu when teacher detected
  const studentNavItems = [{ label: "My Learning", icon: BookOpen, href: "/dashboard/student" }];
  const teacherNavItems = [
    { label: "Dashboard", icon: BookOpen, href: "/dashboard/teacher" },
    // add more teacher nav items if you want
  ];

  const getNavItems = () => {
    // If user is a teacher (nextAuth or legacy) show teacher items
    if (isNextAuthTeacher || teacherUser) return teacherNavItems;
    // otherwise keep student nav minimal (unchanged)
    return studentNavItems;
  };

  const avatarRing = "ring-blue-600 ring-offset-2";

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-200 bg-white ${isScrolled ? "shadow-sm" : ""}`}>
      <nav className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo link:
            - if teacher detected -> /dashboard/teacher
            - else if student -> /dashboard/student
            - else -> home
        */}
        <Link
          href={user ? (isNextAuthTeacher || teacherUser ? "/dashboard/teacher" : "/dashboard/student") : "/"}
          className="flex items-center space-x-2"
        >
          <img src="/Azroute.jpeg" alt="Azroute Logo" className="h-20 w-34 object-contain" />
        </Link>

        <div className="hidden md:flex items-center space-x-8">
          <Button variant="ghost" asChild className="font-medium text-gray-700 hover:text-blue-600">
            <Link href="/explore" className="flex items-center">
              <Globe className="h-4 w-4 mr-2" />
              Explore
            </Link>
          </Button>

          <Button variant="ghost" asChild className="font-medium text-gray-700 hover:text-blue-600">
            <Link href="/teachers" className="flex items-center">
              <GraduationCap className="h-4 w-4 mr-2" />
              Our Coaches
            </Link>
          </Button>

          {/* Keep Coach on Azroute link unchanged (always visible) */}
          <Button variant="ghost" asChild className="font-medium text-gray-700 hover:text-blue-600 transition-colors">
            <Link href="/auth/teacher/login">Coach on Azroute</Link>
          </Button>
        </div>

        <div className="flex items-center space-x-6">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100/80">
                  <Avatar className={`h-8 w-8 ring ${avatarRing}`}>
                    {user?.image ? <AvatarImage src={user.image} alt={user.name} /> : <AvatarFallback>{getUserInitials()}</AvatarFallback>}
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="p-4">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />
                {getNavItems().map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href} className="flex items-center">
                      <item.icon className="h-4 w-4 mr-3 text-gray-500" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-3" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" className="font-medium text-gray-700 hover:text-blue-600" onClick={() => router.push("/auth/student/login")}>
                Log In
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium" onClick={() => router.push("/auth/student/signup")}>
                Get Started
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
