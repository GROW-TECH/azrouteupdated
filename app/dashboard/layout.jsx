// app/dashboard/layout.jsx
import { Navbar } from "../components/Navbar";

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}