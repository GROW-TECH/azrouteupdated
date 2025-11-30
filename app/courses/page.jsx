'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  BookOpen,
  Users,
  Clock,
  Star,
  ChevronRight,
  SlidersHorizontal,
  GraduationCap
} from 'lucide-react';

const ITEMS_PER_PAGE = 12;

const CourseCard = ({ course }) => {
  // Add null checks and default values
  const {
    title = '',
    description = '',
    thumbnail = '/placeholder-course.jpg',
    featured = false,
    enrolledStudents = 0,
    totalDuration = 0,
    price = 0,
    rating = 0,
    teacher = {}
  } = course || {};

  // Safely access teacher properties with defaults
  const {
    firstName = '',
    lastName = '',
    profileImage = '/placeholder-avatar.jpg',
    department = '',
    qualification = ''
  } = teacher || {};

  const teacherName = firstName && lastName ? `${firstName} ${lastName}` : 'Unknown Teacher';

  return (
    <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      <div className="relative aspect-video">
        <img
          src={thumbnail}
          alt={title}
          className="object-cover w-full h-full"
        />
        {featured && (
          <div className="absolute top-2 right-2">
            <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
              Featured
            </span>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex flex-col h-full">
          <div>
            <h3 className="font-semibold line-clamp-2 mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {description}
            </p>
            <div className="flex items-center text-sm text-muted-foreground mb-3">
              <div className="flex items-center mr-4">
                <Users className="h-4 w-4 mr-1" />
                {enrolledStudents} students
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {Math.ceil(totalDuration / 60)}h
              </div>
            </div>
          </div>
          <div className="mt-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={profileImage}
                  alt={teacherName}
                  className="h-6 w-6 rounded-full"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{teacherName}</span>
                  {department && (
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" />
                      {department}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                <span className="text-sm font-medium">{rating.toFixed(1)}</span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-lg font-bold">
                {price === 0 ? 'Free' : `£${price}`}
              </span>
              <Button variant="ghost" size="sm">
                Learn More
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SkeletonCard = () => (
  <div className="relative h-[380px]">
    <Skeleton className="w-full h-[200px]" />
    <div className="p-4">
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-4" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  </div>
);

const CourseCatalog = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCourses: 0
  });

  const [filters, setFilters] = useState({
    search: searchParams?.get('search') || '',
    level: searchParams?.get('level') || 'all',
    price: searchParams?.get('price') || 'all',
    department: searchParams?.get('department') || 'all',
    sort: searchParams?.get('sort') || 'popular'
  });


  useEffect(() => {
    fetchCourses();
  }, [filters, pagination.currentPage]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        ...filters,
        page: pagination.currentPage,
        limit: ITEMS_PER_PAGE
      });

      const response = await fetch(`/api/courses/search?${queryParams}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message);
      
      setCourses(data.courses || []);
      setPagination(prev => ({
        ...prev,
        totalPages: data.pagination.totalPages,
        totalCourses: data.pagination.totalCourses
      }));
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams?.toString() || '');
    if (value && value !== 'all') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    router.push(`/courses?${newParams.toString()}`);
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      handleFilterChange('search', e.target.value);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Explore Our Courses</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover high-quality courses taught by expert instructors across medical, dental, and nursing domains
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                className="pl-9"
                defaultValue={filters.search}
                onKeyDown={handleSearch}
              />
            </div>
          </div>

       

          <Select
            value={filters.sort}
            onValueChange={(value) => handleFilterChange('sort', value)}
          >
            <SelectTrigger>
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Select
            value={filters.level}
            onValueChange={(value) => handleFilterChange('level', value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.price}
            onValueChange={(value) => handleFilterChange('price', value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Price" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
       {/* Add department filter */}
       <Select
            value={filters.department}
            onValueChange={(value) => handleFilterChange('department', value)}
          >
            <SelectTrigger>
              <GraduationCap className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="medical">Medical</SelectItem>
              <SelectItem value="dental">Dental</SelectItem>
              <SelectItem value="nursing">Nursing</SelectItem>
            </SelectContent>
          </Select>

      {/* Course Grid */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={`skeleton-${i}`} />
          ))}
        </div>
      ) : courses.length > 0 ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div
                key={course._id}
                onClick={() => router.push(`/courses/${course._id}`)}
              >
                <CourseCard course={course} />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              <Button
                variant="outline"
                onClick={() => setPagination(prev => ({
                  ...prev,
                  currentPage: Math.max(1, prev.currentPage - 1)
                }))}
                disabled={pagination.currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: pagination.totalPages }).map((_, i) => (
                <Button
                  key={`page-${i + 1}`}
                  variant={pagination.currentPage === i + 1 ? "default" : "outline"}
                  onClick={() => setPagination(prev => ({
                    ...prev,
                    currentPage: i + 1
                  }))}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={() => setPagination(prev => ({
                  ...prev,
                  currentPage: Math.min(pagination.totalPages, prev.currentPage + 1)
                }))}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-xl font-semibold">No Courses Found</h3>
          <p className="mt-2 text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
};

export default function CourseCatalogPage() {
  return (
    <Suspense fallback={<SkeletonCard />}>
      <CourseCatalog />
    </Suspense>
  );
}