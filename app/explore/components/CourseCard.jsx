'use client';

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Clock,
  Star,
  BookOpen,
  GraduationCap
} from "lucide-react";

export function CourseCard({ course, onClick }) {
  const {
    title,
    thumbnail,
    description,
    price,
    discountedPrice,
    enrolledStudents,
    totalDuration,
    rating,
    level,
    teacher,
    featured
  } = course;

  // Calculate duration in hours
  const durationInHours = Math.ceil(totalDuration / 60);

  // Format teacher name and get profile image
  const teacherName = teacher ? 
    `${teacher.firstName} ${teacher.lastName}` : 
    'Unknown Teacher';
  const teacherImage = teacher?.profileImage || '/placeholder-avatar.jpg';

  return (
    <Card
      className="h-full overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative aspect-video">
        <img
          src={thumbnail || '/placeholder-course.jpg'}
          alt={title}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        {featured && (
          <Badge className="absolute top-2 right-2 bg-primary">
            Featured
          </Badge>
        )}
        {discountedPrice && (
          <Badge className="absolute top-2 left-2 bg-red-500">
            {Math.round(((price - discountedPrice) / price) * 100)}% OFF
          </Badge>
        )}
      </div>

      <div className="p-4">
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              <GraduationCap className="h-3 w-3 mr-1" />
              {level}
            </Badge>
            {rating > 0 && (
              <div className="flex items-center text-sm">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                <span className="font-medium">{rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          <h3 className="font-semibold line-clamp-2 text-lg mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {description}
          </p>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            {enrolledStudents} students
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {durationInHours}h
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src={teacherImage}
                alt={teacherName}
                className="h-8 w-8 rounded-full object-cover"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{teacherName}</span>
                {teacher?.department && (
                  <Badge variant="secondary" className="text-xs">
                    {teacher.department}
                  </Badge>
                )}
              </div>
            </div>
            <div>
              {price === 0 ? (
                <span className="text-lg font-bold text-green-600">Free</span>
              ) : (
                <div className="text-right">
                  <span className="text-lg font-bold">£{discountedPrice || price}</span>
                  {discountedPrice && (
                    <span className="text-sm text-muted-foreground line-through ml-2">
                      £{price}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}