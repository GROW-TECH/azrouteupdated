// components/dashboard/DashboardNav.jsx
"use client"
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  MessageSquare,
  Users,
  FileText,
  Settings,
  GraduationCap,
  BarChart,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function DashboardNav({ userType }) {
  const pathname = usePathname();
  
  const teacherNavItems = [
    {
      title: "Overview",
      icon: LayoutDashboard,
      href: "/dashboard/teacher",
    },
    {
      title: "Courses",
      icon: BookOpen,
      href: "/dashboard/teacher/courses",
    },
    {
      title: "Assignments",
      icon: FileText,
      href: "/dashboard/teacher/assignments",
    },
    {
      title: "Schedule",
      icon: Calendar,
      href: "/dashboard/teacher/schedule",
    },
    {
      title: "Students",
      icon: Users,
      href: "/dashboard/teacher/students",
    },
    {
      title: "Discussions",
      icon: MessageSquare,
      href: "/dashboard/teacher/discussions",
    },
    {
      title: "Analytics",
      icon: BarChart,
      href: "/dashboard/teacher/analytics",
    },
  ];

  const studentNavItems = [
    {
      title: "Overview",
      icon: LayoutDashboard,
      href: "/dashboard/student",
    },
    {
      title: "My Courses",
      icon: BookOpen,
      href: "/dashboard/student/courses",
    },
    {
      title: "Assignments",
      icon: FileText,
      href: "/dashboard/student/assignments",
    },
    {
      title: "Schedule",
      icon: Calendar,
      href: "/dashboard/student/schedule",
    },
    {
      title: "Discussions",
      icon: MessageSquare,
      href: "/dashboard/student/discussions",
    },
    {
      title: "Progress",
      icon: GraduationCap,
      href: "/dashboard/student/progress",
    },
  ];

  const navItems = userType === 'teacher' ? teacherNavItems : studentNavItems;

  return (
    <nav className="hidden lg:flex w-64 flex-col border-r bg-background h-[calc(100vh-4rem)] p-6">
      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                pathname === item.href ? "bg-accent" : "transparent"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </div>
      
      <div className="mt-auto">
        <Link
          href={`/dashboard/${userType}/settings`}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
            pathname === `/dashboard/${userType}/settings` ? "bg-accent" : "transparent"
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </nav>
  );
}