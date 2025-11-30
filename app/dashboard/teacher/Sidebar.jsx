"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Book,
  Calendar,
  Layout,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  FileText,
  Video,
  Users,
  TrendingUp,
  ClipboardList,
} from "lucide-react";
import { Skeleton } from "@/app/components/ui/skeleton";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/check", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          // Accept both 'teacher' and 'coach' roles
          if (data.user?.role === "teacher" || data.user?.role === "coach") {
            // prefer structured name parts if present, otherwise fall back to single 'name'
            const fullName =
              [data.user.firstName, data.user.middleName, data.user.lastName].filter(Boolean).join(" ") ||
              data.user.name ||
              data.user.email ||
              "";

            const initials =
              (fullName
                ? fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : data.user.coachDisplayId?.slice(0, 2)?.toUpperCase()) || "AZ";

            setTeacher({
              name: fullName,
              email: data.user.email,
              avatar: data.user.profile?.avatar ?? data.user.avatar ?? null,
              initials,
            });
          }
        }
      } catch (e) {
        console.error("Sidebar auth check error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const menuItems = [
    { icon: Layout, label: "Dashboard", href: "/dashboard/teacher" },
    { icon: Book, label: "Assigned Courses", href: "/dashboard/teacher/courses" },
    { icon: Users, label: "Students", href: "/dashboard/teacher/students" },
    { icon: TrendingUp, label: "Students Progress", href: "/dashboard/teacher/progress" },
    { icon: ClipboardList, label: "Assessments Marks", href: "/dashboard/teacher/assessment" },
    { icon: Calendar, label: "Events", href: "/dashboard/teacher/events" },
    { icon: MessageSquare, label: "Live Classes", href: "/dashboard/teacher/liveclasses" },
    { icon: Video, label: "Demo Class", href: "/dashboard/teacher/demo-class" },
  ];

  return (
    <div
      className={`relative min-h-screen bg-white border-r shadow-sm transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-white border rounded-full p-1.5 shadow-md hover:bg-gray-50"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-gray-600" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        )}
      </button>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {menuItems.map(({ icon: Icon, label, href }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center px-3 py-3 rounded-lg transition-colors ${
                    active ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? "text-white" : "text-gray-500"}`} />
                  {!isCollapsed && <span className="ml-3">{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t">
        <Link
          href="/dashboard/teacher/profile"
          className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-100"
        >
          {loading ? (
            <>
              <Skeleton className="w-8 h-8 rounded-full" />
              {!isCollapsed && (
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              )}
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center overflow-hidden">
                {teacher?.avatar ? (
                  // keep plain img to avoid next/image SSR pitfalls in sidebar
                  <img src={teacher.avatar} alt={teacher.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-sm font-medium text-white">{teacher?.initials || "AZ"}</span>
                )}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{teacher?.name || "No name"}</p>
                  <p className="text-xs text-gray-500 truncate">{teacher?.email || "No email"}</p>
                </div>
              )}
            </>
          )}
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
