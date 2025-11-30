"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RequestCategoryDialog } from '@/components/request-category-dialog';

export default function RequestCategory() {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setIsTeacher(data.user?.role === 'teacher');
        
        if (!data.user || data.user.role !== 'teacher') {
          router.push('/auth/teacher/login?redirect=/request-category');
        }
      } else {
        router.push('/auth/teacher/login?redirect=/request-category');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/auth/teacher/login?redirect=/request-category');
    }
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    router.push('/dashboard/teacher');
  };

  if (!isAuthenticated || !isTeacher) {
    return null; // Don't render anything while checking auth or redirecting
  }

  return (
    <RequestCategoryDialog
      isOpen={isDialogOpen}
      onClose={handleClose}
    />
  );
}