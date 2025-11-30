// app/explore/layout.jsx
import { Navbar } from "@/components/Navbar";

export default function ExploreLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}