"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Menu,
  CheckCircle,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import ReactPlayer from 'react-player';
import { use } from 'react';


export default function CourseLearningPage({ params }) {
  const router = useRouter();
  const { toast } = useToast();
  const { courseId, lessonId } =use(params);
  const playerRef = useRef(null);

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [watchTime, setWatchTime] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, lessonRes] = await Promise.all([
          fetch(`/api/student/courses/${courseId}`),
          fetch(`/api/student/courses/${courseId}/lessons/${lessonId}`)
        ]);

        if (!courseRes.ok || !lessonRes.ok) {
          throw new Error('Failed to fetch course data');
        }

        const [courseData, lessonData] = await Promise.all([
          courseRes.json(),
          lessonRes.json()
        ]);

        setCourse(courseData.course);
        setEnrollment(courseData.enrollment);
        setCurrentLesson(lessonData.lesson);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, lessonId]);

  const updateProgress = async () => {
    try {
      const response = await fetch('/api/student/courses/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          lessonId,
          progress,
          watchTime
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update progress');
      }

      const data = await response.json();
      setEnrollment(data.enrollment);

    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleProgress = (state) => {
    const newProgress = (state.playedSeconds / state.loadedSeconds) * 100;
    setProgress(newProgress);
    setWatchTime(state.playedSeconds);

    // Update progress every 30 seconds
    if (Math.floor(state.playedSeconds) % 30 === 0) {
      updateProgress();
    }
  };

  const handleLessonComplete = async () => {
    setProgress(100);
    await updateProgress();
  };

  const handleNextLesson = () => {
    const allLessons = course.sections.flatMap(s => s.lessons);
    const currentIndex = allLessons.findIndex(l => l.id === lessonId);
    if (currentIndex < allLessons.length - 1) {
      router.push(`/dashboard/student/courses/${courseId}/learn/${allLessons[currentIndex + 1].id}`);
    }
  };

  const handlePreviousLesson = () => {
    const allLessons = course.sections.flatMap(s => s.lessons);
    const currentIndex = allLessons.findIndex(l => l.id === lessonId);
    if (currentIndex > 0) {
      router.push(`/dashboard/student/courses/${courseId}/learn/${allLessons[currentIndex - 1].id}`);
    }
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

  return (
    <div className="flex h-screen">
      {/* Video Player */}
      <div className="flex-1 flex flex-col">
        <div className="relative w-full bg-black" style={{ paddingTop: '56.25%' }}>
          <ReactPlayer
            ref={playerRef}
            url={currentLesson.videoURL}
            className="absolute top-0 left-0"
            width="100%"
            height="100%"
            playing={playing}
            controls={true}
            onProgress={handleProgress}
            onEnded={handleLessonComplete}
            config={{
              file: {
                attributes: {
                  controlsList: 'nodownload',
                  onContextMenu: e => e.preventDefault()
                }
              }
            }}
          />
        </div>

        {/* Lesson Info */}
        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{currentLesson.title}</h1>
              <p className="text-sm text-muted-foreground">
                {course.title}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousLesson}
                disabled={!course.sections.flatMap(s => s.lessons).find(l => l.id === lessonId)?.previousLessonId}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={handleLessonComplete}
                disabled={progress === 100}
              >
                Mark as Complete
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextLesson}
                disabled={!course.sections.flatMap(s => s.lessons).find(l => l.id === lessonId)?.nextLessonId}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Progress 
            value={progress} 
            className="mt-4"
          />
        </div>

        {/* Course Content on Desktop */}
        <div className="hidden md:block flex-1 border-t overflow-y-auto">
          <div className="p-4">
            <h2 className="font-semibold mb-4">Course Content</h2>
            <CourseContentList 
              sections={course.sections}
              currentLessonId={lessonId}
              enrollment={enrollment}
              onSelectLesson={(lessonId) => 
                router.push(`/dashboard/student/courses/${courseId}/learn/${lessonId}`)
              }
            />
          </div>
        </div>
      </div>

      {/* Course Content on Mobile */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="fixed bottom-4 right-4 md:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Course Content</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
            <CourseContentList 
              sections={course.sections}
              currentLessonId={lessonId}
              enrollment={enrollment}
              onSelectLesson={(lessonId) => {
                router.push(`/dashboard/student/courses/${courseId}/learn/${lessonId}`);
              }}
            />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CourseContentList({ sections, currentLessonId, enrollment, onSelectLesson }) {
  return (
    <div className="space-y-4">
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="space-y-2">
          <h3 className="font-medium">{section.title}</h3>
          <div className="space-y-1">
            {section.lessons.map((lesson, lessonIndex) => {
              const lessonProgress = enrollment?.lessonsProgress?.find(
                p => p.lessonId === lesson.id
              );
              const isCompleted = lessonProgress?.completed;
              const isCurrent = lesson.id === currentLessonId;

              return (
                <Button
                  key={lessonIndex}
                  variant={isCurrent ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => onSelectLesson(lesson.id)}
                >
                  <div className="flex items-center w-full">
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    <span className="flex-1 text-left">{lesson.title}</span>
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}