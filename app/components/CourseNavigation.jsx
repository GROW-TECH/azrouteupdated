import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Play, Clock, ChevronRight, UserCircle } from "lucide-react";

const LessonCard = ({ lesson, isActive, progress = 0, onClick }) => {
  const duration = Math.ceil(lesson.duration / 60);

  return (
    <Card 
      className={`mb-3 transition-all hover:shadow-md cursor-pointer group ${
        isActive ? 'border-primary bg-primary/5' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`mt-1 h-5 w-5 rounded-full border-2 flex-shrink-0 transition-colors ${
            isActive ? 'bg-primary border-primary' : 'group-hover:border-primary'
          }`}>
            {isActive && <Play className="h-3 w-3 text-primary-foreground m-auto" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-sm truncate leading-5">{lesson.title}</h4>
              {progress > 0 && (
                <Badge variant="secondary" className="flex-shrink-0">
                  {Math.round(progress)}%
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3" />
              <span>{duration} min</span>
              {lesson.type && (
                <>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                  <span>{lesson.type}</span>
                </>
              )}
            </div>
          </div>
        </div>
        {progress > 0 && (
          <Progress value={progress} className="h-1 mt-3" />
        )}
      </CardContent>
    </Card>
  );
};

const CourseNavigation = ({ course, currentLessonId, progress, onSelectLesson, isMobile = false }) => {
  // Calculate section progress
  const calculateSectionProgress = (lessons) => {
    const totalProgress = lessons.reduce((acc, lesson) => {
      return acc + (progress[lesson._id]?.progress || 0);
    }, 0);
    return totalProgress / lessons.length;
  };

  return (
    <>
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-4">
          <UserCircle className="h-6 w-6" />
          <h2 className="font-semibold truncate">{course.title}</h2>
        </div>
        {!isMobile && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.location.href = '/dashboard/student'}
          >
            Back to Dashboard
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {course.sections.map((section, index) => (
            <div key={index}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Section {index + 1}
                  </span>
                  <h3 className="font-semibold text-sm mt-1">{section.title}</h3>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline">
                    {section.lessons.length} Lessons
                  </Badge>
                  {calculateSectionProgress(section.lessons) > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {Math.round(calculateSectionProgress(section.lessons))}% Complete
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {section.lessons.map((lesson) => (
                  <LessonCard
                    key={lesson._id}
                    lesson={lesson}
                    isActive={lesson._id === currentLessonId}
                    progress={progress[lesson._id]?.progress || 0}
                    onClick={() => onSelectLesson(lesson._id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </>
  );
};

export default CourseNavigation;