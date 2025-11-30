// app/dashboard/student/courses/[courseId]/learn/page.jsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Play, CheckCircle, ChevronRight } from "lucide-react";
import { use } from 'react';

export default function CourseLearnPage({ params }) {
  const router = useRouter();
  const { courseId } =use(params);
  
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await fetch(`/api/student/courses/${courseId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch course data');
        }

        const data = await response.json();
        setCourse(data.course);
        setEnrollment(data.enrollment);

        // If there's no enrollment, redirect to course details
        // if (!data.enrollment) {
        //   router.push(`/dashboard/student/courses/${courseId}`);
        //   return;
        // }

        // If there is an enrollment, redirect to the first uncompleted lesson
        const firstUncompletedLesson = findFirstUncompletedLesson(
          data.course.sections,
          data.enrollment.lessonsProgress
        );
        
        if (firstUncompletedLesson) {
          router.push(`/dashboard/student/courses/${courseId}/learn/${firstUncompletedLesson}`);
        } else {
          // If all lessons are completed, go to the first lesson
          const firstLesson = data.course.sections[0]?.lessons[0]?.id;
          if (firstLesson) {
            router.push(`/dashboard/student/courses/${courseId}/learn/${firstLesson}`);
          }
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, router]);

  const findFirstUncompletedLesson = (sections, lessonsProgress) => {
    for (const section of sections) {
      for (const lesson of section.lessons) {
        const isCompleted = lessonsProgress?.find(
          progress => progress.lessonId === lesson.id && progress.completed
        );
        if (!isCompleted) {
          return lesson.id;
        }
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Error Loading Course</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return null; // The page will redirect, so no need to render anything
}
