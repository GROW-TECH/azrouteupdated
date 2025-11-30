// components/dashboard/DashboardLayout.jsx
import { DashboardNav } from "./DashboardNav";
import { DashboardHeader } from "./DashboardHeader";
import { cn } from "@/lib/utils";

export function DashboardLayout({ children, userType }) {
  return (
    <div className="min-h-screen bg-gray-50/40">
      <DashboardHeader userType={userType} />
      <div className="flex">
        <DashboardNav userType={userType} />
        <main className="flex-1 p-8 lg:px-12">{children}</main>
      </div>
    </div>
  );
}
