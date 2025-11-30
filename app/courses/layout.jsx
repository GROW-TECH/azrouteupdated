// app/courses/layout.jsx
import { Navbar } from "@/components/Navbar";

export default function CoursesLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}