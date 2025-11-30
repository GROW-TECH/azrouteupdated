// components/courses/CourseList.jsx
"use client"
import { useState } from 'react';
import { CourseGrid } from "./CourseGrid";
import { CourseFilters } from "./CourseFilters";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { CreateCourseDialog } from "./CreateCourseDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Grid, List, Search, SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";

export function CourseList({ userType }) {
  const [view, setView] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  const courses = [
    {
      id: 1,
      title: "Advanced Web Development",
      teacher: {
        id: "t1",
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah.johnson@example.com",
        department: "Computer Science",
        qualification: "Ph.D. in Computer Science",
        experience: "10+ years in Web Development",
        profileImage: "/placeholders/teacher-1.jpg",
        subjects: ["Web Development", "JavaScript", "React"]
      },
      thumbnail: "/placeholders/course-1.jpeg",
      category: "Development",
      level: "Advanced",
      rating: 4.8,
      studentsEnrolled: 256,
      price: 89.99,
      duration: "8 weeks",
      status: "In Progress",
      progress: 65,
      description: "Master modern web development techniques and frameworks.",
      tags: ["React", "Node.js", "JavaScript"],
      lastUpdated: "2024-10-25",
    },
    {
      id: 2,
      title: "Data Structures & Algorithms",
      teacher: {
        id: "t2",
        firstName: "Michael",
        lastName: "Chen",
        email: "michael.chen@example.com",
        department: "Computer Science",
        qualification: "Ph.D. in Computer Science",
        experience: "15 years in Algorithm Design",
        profileImage: "/placeholders/teacher-2.jpg",
        subjects: ["Algorithms", "Data Structures", "Python"]
      },
      thumbnail: "/placeholders/course-2.jpg",
      category: "Computer Science",
      level: "Intermediate",
      rating: 4.6,
      studentsEnrolled: 189,
      price: 79.99,
      duration: "10 weeks",
      status: "Not Started",
      progress: 0,
      description: "Learn essential programming concepts and problem-solving techniques.",
      tags: ["Python", "Algorithms", "Data Structures"],
      lastUpdated: "2024-10-28",
    },
    // Add more courses as needed
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex-1 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="hidden md:flex gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[300px]">
              <SheetHeader>
                <SheetTitle>Filter Courses</SheetTitle>
              </SheetHeader>
              <CourseFilters />
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex gap-4">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border rounded-lg">
            <Button
              variant={view === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setView('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setView('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {userType === 'teacher' && <CreateCourseDialog />}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Filters - Desktop */}
        <div className="hidden lg:block col-span-3">
          <CourseFilters />
        </div>

        {/* Course Grid/List */}
        <div className="col-span-12 lg:col-span-9">
          <CourseGrid 
            courses={courses} 
            view={view} 
            userType={userType}
          />
        </div>
      </div>
    </div>
  );
}