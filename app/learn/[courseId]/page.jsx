// app/learn/[courseId]/page.jsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  BookOpen,
  Clock,
  Medal,
  CheckCircle,
  Loader2,
  AlertCircle
} from "lucide-react";
import { use } from 'react';

export default function CourseLearning({ params }) {
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const {courseId}=use(params)
  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
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
      setEnrollment(progressData);
    } catch (error) {
      console.error('Error fetching course data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const findLastAccessedLesson = () => {
    if (!course || !enrollment) return null;

    // Find the last accessed lesson or first incomplete lesson
    let lastAccessedLessonId = null;
    let firstIncompleteLessonId = null;

    for (const section of course.sections) {
      for (const lesson of section.lessons) {
        const progress = enrollment.progress[lesson._id];
        if (progress?.lastAccessedAt) {
          if (!lastAccessedLessonId || 
              new Date(progress.lastAccessedAt) > 
              new Date(enrollment.progress[lastAccessedLessonId].lastAccessedAt)) {
            lastAccessedLessonId = lesson._id;
          }
        }
        if (!progress?.completed && !firstIncompleteLessonId) {
          firstIncompleteLessonId = lesson._id;
        }
      }
    }

    return lastAccessedLessonId || firstIncompleteLessonId || course.sections[0]?.lessons[0]?._id;
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">{course.title}</h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Progress Overview */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Your Progress</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Course Progress</span>
                <span>{Math.round(enrollment.overallProgress)}%</span>
              </div>
              <Progress value={enrollment.overallProgress} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">
                  {Object.values(enrollment.progress).filter(p => p.completed).length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Lessons Completed
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {Math.round(
                    Object.values(enrollment.progress)
                      .reduce((sum, p) => sum + (p.watchTime || 0), 0) / 60
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Minutes Watched
                </div>
              </div>
            </div>
            <Button 
              className="w-full"
              onClick={() => {
                const lessonId = findLastAccessedLesson();
                if (lessonId) {
                  router.push(`/learn/${courseId}/lessons/${lessonId}`);
                }
              }}
            >
              <Play className="h-4 w-4 mr-2" />
              Continue Learning
            </Button>
          </div>
        </Card>

        {/* Course Content */}
        <Card className="md:col-span-2 p-6">
          <h2 className="text-xl font-semibold mb-4">Course Content</h2>
          <div className="space-y-6">
            {course.sections.map((section, index) => (
              <div key={index}>
                <h3 className="font-medium text-lg mb-2">{section.title}</h3>
                <div className="space-y-2">
                  {section.lessons.map((lesson) => {
                    const progress = enrollment.progress[lesson._id];
                    return (
                      <div
                        key={lesson._id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/learn/${courseId}/lessons/${lesson._id}`)}
                      >
                        <div className="flex items-center space-x-3">
                          {progress?.completed ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Play className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <div className="font-medium">{lesson.title}</div>
                            <div className="text-sm text-muted-foreground flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {Math.ceil(lesson.duration / 60)} min
                            </div>
                          </div>
                        </div>
                        {progress?.watchTime > 0 && !progress.completed && (
                          <div className="w-24">
                            <Progress
                              value={(progress.watchTime / lesson.duration) * 100}
                              className="h-2"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Additional Cards */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Course Stats</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-muted-foreground mr-2" />
                <span>Total Duration</span>
              </div>
              <span>{Math.ceil(course.totalDuration / 60)} mins</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 text-muted-foreground mr-2" />
                <span>Total Lessons</span>
              </div>
              <span>{course.totalLessons}</span>
            </div>
            {enrollment.certificate && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">Course Certificate</h3>
                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={() => window.open(enrollment.certificate.url, '_blank')}
                >
                  <Medal className="h-4 w-4 mr-2" />
                  View Certificate
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Resources</h2>
          <div className="space-y-4">
            {course.resources?.length > 0 ? (
              <div className="space-y-2">
                {course.resources.map((resource, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => window.open(resource.url, '_blank')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {resource.title}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No additional resources available for this course.
              </p>
            )}
          </div>
        </Card>

        {enrollment.completedAt && (
          <Card className="p-6 bg-green-50 dark:bg-green-900/10">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Course Completed!</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Completed on {new Date(enrollment.completedAt).toLocaleDateString()}
              </p>
              {enrollment.certificate && (
                <Button 
                  onClick={() => window.open(enrollment.certificate.url, '_blank')}
                >
                  <Medal className="h-4 w-4 mr-2" />
                  View Certificate
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}