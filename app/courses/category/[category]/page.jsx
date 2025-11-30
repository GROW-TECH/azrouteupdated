'use client';

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";

function CategoryContent() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    level: 'all',
    sort: 'newest',
    search: '',
    instructor: 'all'
  });

  const categoryTitle = params.category.charAt(0).toUpperCase() + params.category.slice(1);

  useEffect(() => {
    fetchCategoryData();
  }, [params.category, filters]);

  const fetchCategoryData = async () => {
    try {
      setLoading(true);
      
      // Fetch courses for the category
      const courseQueryParams = new URLSearchParams({
        ...filters,
        domain: params.category,
        level: filters.level === 'all' ? '' : filters.level,
        instructor: filters.instructor === 'all' ? '' : filters.instructor,
        page: 1,
        limit: 12
      });

      const [coursesResponse, instructorsResponse] = await Promise.all([
        fetch(`/api/courses?${courseQueryParams}`),
        fetch(`/api/instructors?domain=${params.category}`)
      ]);

      const [coursesData, instructorsData] = await Promise.all([
        coursesResponse.json(),
        instructorsResponse.json()
      ]);

      if (!coursesResponse.ok) throw new Error(coursesData.message);
      if (!instructorsResponse.ok) throw new Error(instructorsData.message);

      setCourses(coursesData.courses);
      setInstructors(instructorsData.instructors);
    } catch (error) {
      console.error('Failed to fetch category data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (courseId) => {
    if (session) {
      router.push(`/courses/${courseId}`);
    } else {
      router.push(`/auth/student/login?redirect=/courses/${courseId}`);
    }
  };

  return (
    <>
      {/* Search and Filters */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${categoryTitle} courses...`}
              className="pl-9"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </div>
        <Select
          value={filters.instructor}
          onValueChange={(value) => setFilters(prev => ({ ...prev, instructor: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Instructor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Instructors</SelectItem>
            {instructors.map((instructor) => (
              <SelectItem key={instructor._id} value={instructor._id}>
                {instructor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.sort}
          onValueChange={(value) => setFilters(prev => ({ ...prev, sort: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Instructors Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Top {categoryTitle} Instructors</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {instructors.slice(0, 4).map((instructor) => (
            <Card key={instructor._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-24 h-24 rounded-full overflow-hidden">
                  <img
                    src={instructor?.avatar || '/placeholder-avatar.jpg'}
                    alt={instructor.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardTitle className="text-lg">{instructor.name}</CardTitle>
                <CardDescription>{instructor.specialty}</CardDescription>
              </CardHeader>
              <CardContent className="text-center text-sm text-muted-foreground">
                <p>{instructor.coursesCount} courses</p>
                <p>{instructor.studentsCount} students</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      <h2 className="text-2xl font-bold mb-6">{categoryTitle} Courses</h2>
      {loading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : courses.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card 
              key={course._id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleCourseClick(course._id)}
            >
              <div className="aspect-video relative overflow-hidden rounded-t-lg">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="object-cover w-full h-full"
                />
              </div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <CardDescription>{course.teacherName}</CardDescription>
                  </div>
                  <span className="text-lg font-bold">
                    ${course.price}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{course.level}</span>
                  <span>{course.duration}</span>
                  <span>{course.enrolledStudents} students</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No courses found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or search criteria
          </p>
        </div>
      )}
    </>
  );
}

export default function CategoryPage() {
  const params = useParams();
  const categoryTitle = params.category.charAt(0).toUpperCase() + params.category.slice(1);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">{categoryTitle} Courses</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore our comprehensive collection of {categoryTitle.toLowerCase()} courses taught by industry-leading experts.
        </p>
      </div>

      <Suspense 
        fallback={
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        }
      >
        <CategoryContent />
      </Suspense>
    </div>
  );
}