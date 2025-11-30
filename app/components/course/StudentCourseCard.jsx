// components/course/StudentCourseCard.jsx

'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, GraduationCap } from "lucide-react";

export function StudentCourseCard({ course, onContinue }) {
  const handleContinue = () => {
    // Find the first incomplete lesson or the last accessed lesson
    const firstIncompleteLesson = findFirstIncompleteLesson(course.sections, course.progress);
    if (firstIncompleteLesson) {
      onContinue(course.id, firstIncompleteLesson);
    } else {
      // If all lessons are complete, go to the first lesson
      const firstLesson = course.sections[0]?.lessons[0]?._id;
      onContinue(course.id, firstLesson);
    }
  };

  const findFirstIncompleteLesson = (sections, progress) => {
    for (const section of sections || []) {
      for (const lesson of section.lessons || []) {
        const lessonProgress = progress?.find(p => p.lessonId === lesson._id);
        if (!lessonProgress || !lessonProgress.completed) {
          return lesson._id;
        }
      }
    }
    return null;
  };

  // Get teacher name, handling both old and new data structures
  const teacherName = course.teacher ? 
    `${course.teacher.firstName} ${course.teacher.lastName}` : 
    course.teacherName || 'Unknown Teacher';

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video relative">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <Button onClick={handleContinue}>
            <PlayCircle className="h-4 w-4 mr-2" />
            Continue Learning
          </Button>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold line-clamp-1">{course.title}</h3>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  {teacherName}
                </p>
                {course.teacher?.department && (
                  <Badge variant="outline" className="text-xs">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    {course.teacher.department}
                  </Badge>
                )}
              </div>
            </div>
            <Badge variant={course.progress === 100 ? "success" : "secondary"}>
              {course.progress}% Complete
            </Badge>
          </div>
          <Progress value={course.progress} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              {course.completedLessons} / {course.totalLessons} lessons
            </span>
            <span>
              {Math.ceil(course.remainingTime / 60)} hours left
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}