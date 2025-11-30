// components/courses/CourseListItem.jsx
"use client";

import Image from "next/image";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Star, Users, Clock, BookOpen } from "lucide-react";

export function CourseListItem({ course }) {
  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <CardContent className="flex gap-6 p-6">
        <div className="relative w-48 h-36 overflow-hidden rounded-lg">
          <Image
            src={course.thumbnail || "/placeholders/course-1.jpeg"}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{course.category}</Badge>
                <Badge variant={course.level === "Beginner" ? "default" : "secondary"}>
                  {course.level}
                </Badge>
              </div>
              <div className="flex items-center text-yellow-500">
                <Star className="h-4 w-4 fill-current" />
                <span className="ml-1">{course.rating}</span>
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
            <p className="text-muted-foreground line-clamp-2">{course.description}</p>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {course.duration}
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {course.studentsEnrolled} students
            </div>
            <div className="flex items-center">
              <BookOpen className="h-4 w-4 mr-1" />
              {course.lessons} lessons
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative w-10 h-10">
                <Image
                  src={course?.avatar || "/placeholders/course-1.jpeg"}
                  alt={course.teacherName}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <div>
                <p className="font-medium">{course.teacherName}</p>
                <p className="text-sm text-muted-foreground">{course?.role}</p>
              </div>
            </div>
            <Button>View Course</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}