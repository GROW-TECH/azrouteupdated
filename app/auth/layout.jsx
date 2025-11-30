// app/auth/layout.jsx

export const metadata = {
  title: {
    default: 'Authentication - Azroute Chess Institute',
    template: '%s | Azroute Chess Institute',
  },
  description: 'Authentication pages for Azroute Chess Institute',
};

import Link from "next/link";
// import { Button } from "../components/ui/button";
import { Navbar } from "../components/Navbar";

export default function AuthLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
  );
}
