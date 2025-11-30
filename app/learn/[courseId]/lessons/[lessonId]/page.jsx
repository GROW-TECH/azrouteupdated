"use client"

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import VideoPlayer from '@/components/VideoPlayer'
import CourseNavigation from '@/components/CourseNavigation';
import LessonContent from '@/components/LessonContent';
import LearningHeader from '@/components/LearningHeader';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, AlertCircle } from "lucide-react";

export default function LearningInterface() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const courseId = params?.courseId;
  const lessonId = params?.lessonId;

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  useEffect(() => {
    if (course && lessonId) {
      const lesson = findLessonById(lessonId);
      if (lesson) {
        setCurrentLesson(lesson);
      }
    }
  }, [course, lessonId]);

  const findLessonById = (id) => {
    return course?.sections
      .flatMap(section => section.lessons)
      .find(lesson => lesson._id === id);
  };

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const [courseRes, progressRes] = await Promise.all([
        fetch(`/api/courses/${courseId}`),
        fetch(`/api/student/courses/${courseId}/progress`)
      ]);

      if (!courseRes.ok || !progressRes.ok) {
        throw new Error('Failed to fetch course data');
      }

      const [courseData, progressData] = await Promise.all([
        courseRes.json(),
        progressRes.json()
      ]);

      setCourse(courseData.course);
      setProgress(progressData.progress);

      // If no lesson is selected, redirect to the first one
      if (!lessonId) {
        const firstLesson = courseData.course.sections[0]?.lessons[0];
        if (firstLesson) {
          router.replace(`/learn/${courseId}/lessons/${firstLesson._id}`);
        }
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonSelect = (lessonId) => {
    router.push(`/learn/${courseId}/lessons/${lessonId}`);
    setIsSidebarOpen(false);
  };

  const handleLessonProgress = async (percentage, watchTime) => {
    if (!currentLesson) return;

    try {
      const response = await fetch(`/api/student/courses/${courseId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: currentLesson._id,
          progress: percentage,
          watchTime
        })
      });

      if (!response.ok) throw new Error('Failed to update progress');

      const data = await response.json();
      setProgress(data.progress);

      // If progress is 100%, show completion toast
      if (percentage >= 100 && !progress[currentLesson._id]?.completed) {
        toast({
          title: "Lesson Completed! 🎉",
          description: "You can now move to the next lesson or review this one.",
        });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update progress. Please try again.",
      });
    }
  };

  const findAdjacentLesson = (direction) => {
    if (!course || !currentLesson) return null;
    
    const allLessons = course.sections.flatMap(section => section.lessons);
    const currentIndex = allLessons.findIndex(lesson => lesson._id === currentLesson._id);
    
    if (direction === 'next' && currentIndex < allLessons.length - 1) {
      return allLessons[currentIndex + 1];
    } else if (direction === 'previous' && currentIndex > 0) {
      return allLessons[currentIndex - 1];
    }
    return null;
  };

  const handleNavigateLesson = (direction) => {
    const adjacentLesson = findAdjacentLesson(direction);
    if (adjacentLesson) {
      handleLessonSelect(adjacentLesson._id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Error Loading Course</h1>
        <p className="text-muted-foreground mb-4">{error || 'Course not found'}</p>
        <Button onClick={() => router.push('/dashboard')}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col md:w-80 border-r bg-card">
        <CourseNavigation
          course={course}
          currentLessonId={currentLesson?._id}
          progress={progress}
          onSelectLesson={handleLessonSelect}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <LearningHeader
          course={course}
          currentLesson={currentLesson}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />

        {currentLesson && (
          <main className="flex-1 overflow-y-auto">
            <div className="container max-w-6xl py-6 px-4">
              <VideoPlayer
                lesson={currentLesson}
                onProgress={handleLessonProgress}
                progress={progress[currentLesson._id]?.progress || 0}
              />
              
              <LessonContent
                lesson={currentLesson}
                course={course}
                onNextLesson={() => handleNavigateLesson('next')}
                onPreviousLesson={() => handleNavigateLesson('previous')}
                hasNextLesson={!!findAdjacentLesson('next')}
                hasPreviousLesson={!!findAdjacentLesson('previous')}
                progress={progress[currentLesson._id]?.progress || 0}
              />
            </div>
          </main>
        )}
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <CourseNavigation
            course={course}
            currentLessonId={currentLesson?._id}
            progress={progress}
            onSelectLesson={handleLessonSelect}
            isMobile={true}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
