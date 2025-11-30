// components/auth/AuthGuard.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error('Not authenticated');
        }

        const data = await response.json();
        const userType = data.user.role;
        
        // Check if user is accessing the correct dashboard
        const isStudentPath = pathname.startsWith('/dashboard/student');
        const isTeacherPath = pathname.startsWith('/dashboard/teacher');

        if (
          (isStudentPath && userType !== 'student') ||
          (isTeacherPath && userType !== 'teacher')
        ) {
          router.push(`/auth/${userType}/login`);
        }
      } catch (error) {
        const redirectPath = pathname.includes('teacher') 
          ? '/auth/teacher/login' 
          : '/auth/student/login';
        router.push(redirectPath);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return children;
}