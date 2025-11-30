// components/dashboard/student/CourseProgress.jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";

const courses = [
  {
    id: 1,
    title: "Advanced Web Development",
    progress: 75,
    lastAccessed: "2 days ago",
    nextLesson: "React State Management",
    totalLessons: 42,
    completedLessons: 31,
  },
  {
    id: 2,
    title: "UI/UX Design Fundamentals",
    progress: 45,
    lastAccessed: "1 week ago",
    nextLesson: "User Research Methods",
    totalLessons: 36,
    completedLessons: 16,
  },
  // Add more courses as needed
];

export function CourseProgress() {
  return (
    <div className="space-y-4">
      {courses.map((course) => (
        <Card key={course.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{course.title}</CardTitle>
              <Badge variant="secondary">
                {course.completedLessons}/{course.totalLessons} Lessons
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{course.progress}%</span>
                </div>
                <Progress value={course.progress} />
              </div>
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Next Lesson</p>
                  <p className="font-medium">{course.nextLesson}</p>
                </div>
                <Button>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Continue
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}