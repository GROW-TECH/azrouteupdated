// context/AuthContext.jsx
"use client";

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch logged-in student from API
  const fetchStudent = async () => {
    try {
      const res = await fetch("/api/student/profile", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setStudent(data); // Supabase student object
      } else {
        setStudent(null);
      }
    } catch (err) {
      setStudent(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, []);

  return (
    <AuthContext.Provider value={{ student, setStudent, loading, fetchStudent }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
