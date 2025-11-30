import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookMarked,
  MessageCircle,
  FileQuestion,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Share2,
  Bookmark,
  GraduationCap
} from "lucide-react";

const LessonContent = ({
  lesson,
  course,
  onNextLesson,
  onPreviousLesson,
  hasNextLesson,
  hasPreviousLesson,
  progress = 0
}) => {
  return (
    <div className="space-y-8 mt-6">
      {/* Lesson Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GraduationCap className="h-4 w-4" />
            <span>{course.title}</span>
            {progress > 0 && (
              <Badge variant="secondary">
                {Math.round(progress)}% Complete
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold mt-2">{lesson.title}</h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="icon" className="rounded-full">
            <Bookmark className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-full">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Lesson Description */}
      <p className="text-muted-foreground text-sm leading-relaxed">
        {lesson.description}
      </p>

      <Separator />

      {/* Content Tabs */}
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="content" className="gap-2">
            <FileText className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-2">
            <BookMarked className="h-4 w-4" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="discussion" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Discussion
          </TabsTrigger>
          <TabsTrigger value="quiz" className="gap-2">
            <FileQuestion className="h-4 w-4" />
            Quiz
            </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="mt-6">
          <div className="prose prose-sm max-w-none">
            {lesson.content && (
              <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
            )}
          </div>

          {/* Resources Section */}
          {lesson.resources?.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4">Lesson Resources</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {lesson.resources.map((resource, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{resource.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {resource.type} • {resource.size}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 pt-6 border-t">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={onPreviousLesson}
                disabled={!hasPreviousLesson}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous Lesson
              </Button>
              <Button
                onClick={onNextLesson}
                disabled={!hasNextLesson}
                className="gap-2"
              >
                Next Lesson
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="mt-6">
          <Card>
            <CardContent className="p-8 text-center">
              <BookMarked className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 font-semibold text-lg">Notes Feature Coming Soon</h3>
              <p className="text-sm text-muted-foreground mt-2">
                You'll be able to take and organize notes while watching lessons.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Discussion Tab */}
        <TabsContent value="discussion" className="mt-6">
          <Card>
            <CardContent className="p-8 text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 font-semibold text-lg">Discussion Forum Coming Soon</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Connect with other learners and discuss course content.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quiz Tab */}
        <TabsContent value="quiz" className="mt-6">
          <Card>
            <CardContent className="p-8 text-center">
              <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 font-semibold text-lg">Quiz System Coming Soon</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Test your knowledge with interactive quizzes for each lesson.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={onPreviousLesson}
            disabled={!hasPreviousLesson}
            className="gap-2 flex-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            onClick={onNextLesson}
            disabled={!hasNextLesson}
            className="gap-2 flex-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LessonContent;