// components/dashboard/DashboardShell.jsx
import { UserNav } from './UserNav';
import { DashboardNav } from './DashboardNav';
import { Search } from './Search';
import { Bell } from 'lucide-react';
import { Button } from '../ui/button';

export function DashboardShell({ children, userType }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white shadow-sm">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900">ConnectEd</h2>
            <Search />
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <UserNav userType={userType} />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white h-[calc(100vh-4rem)] border-r">
          <div className="flex flex-col h-full">
            <div className="flex-1 py-6 px-4">
              <DashboardNav userType={userType} />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}