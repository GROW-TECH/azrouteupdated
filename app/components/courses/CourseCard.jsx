
// components/courses/CourseCard.jsx
"use client";

import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Star, Users, Clock, BookOpen } from "lucide-react";

export function CourseCard({ course }) {
  return (
    <Card className="flex flex-col h-full group">
      <CardHeader className="p-0">
        <div className="relative aspect-video overflow-hidden rounded-t-lg">
          <div className="w-full h-[200px] relative">
            <Image 
              src={course.thumbnail || "/placeholders/course-1.jpeg"}
              alt={course.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              priority
            />
          </div>
          <Badge className="absolute top-2 right-2">
            {course.level}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline">{course.category}</Badge>
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="ml-1 text-sm">{course.rating}</span>
          </div>
        </div>
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{course.title}</h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {course.description}
        </p>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            {course.studentsEnrolled} students
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {course.duration}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-6">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-10">
              <Image
                src={course?.instructor?.avatar || "/placeholders/course-1.jpeg"}
                alt={course.teacherName}
                className="rounded-full object-cover"
                fill
              />
            </div>
            <div>
              <p className="text-sm font-medium">{course.teacherName}</p>
              <p className="text-xs text-muted-foreground">{course?.role}</p>
            </div>
          </div>
          <Button>View Course</Button>
        </div>
      </CardFooter>
    </Card>
  );
}