// app/dashboard/student/layout.jsx
import Sidebar from './Sidebar';

export default function TeacherDashboardLayout({ children }) {
  return (
    <div className="flex min-h-[calc(100vh-5rem)]">
    <Sidebar />
    <main className="flex-1 mx-20 bg-background">
      {children}
    </main>
  </div>
  );
}