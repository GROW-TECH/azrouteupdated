"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Video,
  FileText,
  ChevronLeft,
  ChevronRight,
  BrainCircuit,
  CalendarClock,
  CreditCard,
} from "lucide-react";
import { Skeleton } from "../../components/ui/skeleton";
import { useAuth } from "../../context/AuthContext";
// chess icon (adjust path)
import { ChessKnight } from "../../components/icons/ChessKnight";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { student } = useAuth();
  const pathname = usePathname();
  const [imgFailed, setImgFailed] = useState(false);
  const [openMenus, setOpenMenus] = useState({ puzzles: true });

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/student" },
    { icon: BookOpen, label: "My Courses", href: "/dashboard/student/courses" },
    // Course Video now points to dashboard page that resolves registered course
    { icon: Video, label: "Course video", href: "/dashboard/student/course-videos" },
    { icon: BarChart3, label: "Progress Tracker", href: "/dashboard/student/progress" },
    { icon: Video, label: "Free Demo Class", href: "/dashboard/student/demo-class" },
    { icon: FileText, label: "Assessment", href: "/dashboard/student/assessment" },
    { icon: CalendarClock, label: "Schedule", href: "/dashboard/student/schedule" },
    { icon: CreditCard, label: "Payment", href: "/dashboard/student/Payment" },
    { icon: BrainCircuit, label: "AI Assessment", href: "/dashboard/student/ai-assessment" },
    // {
    //   icon: ChessKnight,
    //   label: "Puzzles",
    //   href: "/dashboard/student/puzzles",
    //   children: [{ label: "My Puzzle", href: "/dashboard/student/puzzles/daily" }],
    // },
  ];

  const getUserInitials = () => {
    if (!student?.Student_name && !student?.name) return "";
    const name = student?.Student_name || student?.name;
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const avatarSrc = (avatarValue) => {
    if (!avatarValue) return null;
    if (avatarValue.startsWith("data:") || avatarValue.startsWith("http://") || avatarValue.startsWith("https://")) {
      return avatarValue;
    }
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") || "";
    return `${base}/storage/v1/object/public/assests/${encodeURIComponent(avatarValue)}`;
  };

  React.useEffect(() => {
    setImgFailed(false);
  }, [student?.avatar]);

  const toggleMenu = (key) => {
    setOpenMenus((s) => ({ ...s, [key]: !s[key] }));
  };

  return (
    <div
      className={`relative min-h-screen bg-white border-r shadow-sm transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-white border rounded-full p-1.5 shadow-md hover:bg-gray-50"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-gray-600" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        )}
      </button>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            if (item.children && item.children.length > 0) {
              const isParentOpen = openMenus[item.label.toLowerCase()] ?? false;
              const anyChildActive = item.children.some((c) => pathname === c.href || pathname?.startsWith(c.href));
              const parentActive = pathname === item.href || anyChildActive;

              return (
                <li key={item.label}>
                  <div
                    className={`flex items-center justify-between px-3 py-3 rounded-lg transition-colors ${
                      parentActive ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <button
                      onClick={() => toggleMenu(item.label.toLowerCase())}
                      className="flex items-center gap-3 flex-1 text-left"
                      aria-expanded={isParentOpen}
                      title={item.label}
                    >
                      <item.icon className={`h-5 w-5 ${parentActive ? "text-white" : "text-gray-500"}`} />
                      {!isCollapsed && <span className="ml-1">{item.label}</span>}
                    </button>

                    {!isCollapsed && (
                      <button
                        onClick={() => toggleMenu(item.label.toLowerCase())}
                        aria-label={`${isParentOpen ? "Collapse" : "Expand"} ${item.label}`}
                        className={`p-1 rounded ${parentActive ? "text-white" : "text-gray-500"} hover:bg-gray-100`}
                      >
                        <ChevronRight
                          className={`h-4 w-4 transform transition-transform ${isParentOpen ? "rotate-90" : "rotate-0"}`}
                        />
                      </button>
                    )}
                  </div>

                  {isParentOpen && !isCollapsed && (
                    <ul className="mt-2 ml-6 space-y-1">
                      {item.children.map((child) => {
                        const isActive = pathname === child.href || pathname?.startsWith(child.href);
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${
                                isActive ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              <span className="truncate">{child.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            }

            const IconComponent = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-3 rounded-lg transition-colors ${
                    isActive ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <IconComponent className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-500"}`} />
                  {!isCollapsed && <span className="ml-3">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t">
        <Link
          href="/dashboard/student/profile"
          className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-100"
        >
          {student ? (
            <>
              <div
                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center overflow-hidden"
                style={{ minWidth: 32 }}
              >
                {student.avatar && !imgFailed ? (
                  <img
                    src={avatarSrc(student.avatar)}
                    alt={student.Student_name || student.name || "avatar"}
                    className="w-full h-full rounded-full object-cover"
                    loading="lazy"
                    onError={() => setImgFailed(true)}
                  />
                ) : (
                  <span className="text-sm font-medium text-white select-none">{getUserInitials()}</span>
                )}
              </div>

              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {student.Student_name || student.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{student.email}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <Skeleton className="w-8 h-8 rounded-full" />
              {!isCollapsed && (
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
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
