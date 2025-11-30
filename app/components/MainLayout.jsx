// components/MainLayout.jsx
import { Navbar } from "./Navbar";
import { Footer } from "./Footer"; // make sure Footer import is correct too

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
