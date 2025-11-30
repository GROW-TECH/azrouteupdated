'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  Search,
  Loader2,
  Calendar,
  Clock,
  Users,
  Star,
  ChevronLeft,
  ChevronRight,
  Filter,
  BookOpen,
  GraduationCap
} from "lucide-react";

// Constants
const ITEMS_PER_PAGE = 12;
const CATEGORIES = ['Medical', 'Dental', 'Nursing'];
const EVENT_TYPES = ['Workshop', 'Conference', 'Webinar', 'Bootcamp', 'Masterclass'];
const COURSE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' }
];

function CourseCard({ course, onClick }) {
  if (!course) return null;

  const {
    title,
    thumbnail,
    featured,
    level,
    rating = 0,
    description,
    enrolledStudents = 0,
    totalDuration = 0,
    price = 0,
    teacher
  } = course;

  const teacherName = teacher?.name || 'Unknown Teacher';
  const teacherAvatar = teacher?.profileImage || '/logo.png';
  const department = teacher?.department || '';

  return (
    <Card 
      className="h-full overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative aspect-video">
        <img
          src={thumbnail || '/placeholder.jpg'}
          alt={title}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        {featured && (
          <Badge className="absolute top-2 right-2 bg-primary">Featured</Badge>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {level && <Badge variant="outline">{level}</Badge>}
          {rating > 0 && (
            <div className="flex items-center text-sm">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
              {rating.toFixed(1)}
            </div>
          )}
        </div>
        
        <h3 className="font-semibold line-clamp-2 mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {description}
          </p>
        )}
        
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <div className="flex items-center mr-4">
            <Users className="h-4 w-4 mr-1" />
            {enrolledStudents} students
          </div>
          {totalDuration > 0 && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {Math.ceil(totalDuration / 60)}h
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
            <img
              src={teacherAvatar}
              alt={teacherName}
              className="h-8 w-8 rounded-full"
            />
            <div>
              <span className="text-sm font-medium">{teacherName}</span>
              {department && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  <GraduationCap className="h-3 w-3 mr-1" />
                  {department}
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold">
              {price === 0 ? 'Free' : `£${price}`}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function EventCard({ event, onClick }) {
  if (!event) return null;

  const {
    title,
    thumbnail,
    featured,
    category,
    description,
    enrolledStudents = 0,
    totalDuration = 0,
    price = 0,
    discountedPrice,
    level,
    rating = 0,
    lastUpdated,
    teacher
  } = event;

  const teacherName = teacher?.name || 'Unknown Teacher';
  const teacherAvatar = teacher?.profileImage || '/logo.png';
  const department = teacher?.department || '';

  return (
    <Card 
      className="h-full overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative aspect-video">
        <img
          src={thumbnail || '/placeholder.jpg'}
          alt={title}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        {featured && (
          <Badge className="absolute top-2 right-2 bg-primary">Featured</Badge>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {level && <Badge variant="outline">{level}</Badge>}
          {category && <Badge variant="secondary">{category}</Badge>}
          {rating > 0 && (
            <div className="flex items-center text-sm">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
              {rating.toFixed(1)}
            </div>
          )}
        </div>
        
        <h3 className="font-semibold line-clamp-2 mb-3">{title}</h3>
        
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {description}
          </p>
        )}

        <div className="space-y-2 mb-4">
          {lastUpdated && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              {new Date(lastUpdated).toLocaleDateString()}
            </div>
          )}
          
          {enrolledStudents > 0 && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-4 w-4 mr-2" />
              {enrolledStudents} enrolled
            </div>
          )}
          
          {totalDuration > 0 && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-2" />
              {Math.ceil(totalDuration / 60)}h
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
            <img
              src={teacherAvatar}
              alt={teacherName}
              className="h-8 w-8 rounded-full"
            />
            <div>
              <div className="text-sm font-medium">{teacherName}</div>
              {department && (
                <Badge variant="secondary" className="text-xs">
                  <GraduationCap className="h-3 w-3 mr-1" />
                  {department}
                </Badge>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className="text-lg font-bold">
              {price === 0 ? (
                'Free'
              ) : discountedPrice ? (
                <>
                  <span className="line-through text-muted-foreground mr-2">£{price}</span>
                  £{discountedPrice}
                </>
              ) : (
                `£${price}`
              )}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function ExplorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const isFirstLoad = useRef(true);
  const debounceTimer = useRef(null);
  const params = new URLSearchParams(searchParams?.toString() || '');

  // Initialize state
  const [state, setState] = useState({
    activeTab: params.get('type') || 'courses',
    loading: true,
    items: [],
    filters: {
      search: params.get('search') || '',
      category: params.get('category') || 'all',
      level: params.get('level') || 'all',
      department: params.get('department') || 'all',
      eventType: params.get('eventType') || 'all',
      timeframe: params.get('timeframe') || 'upcoming',
      sort: params.get('sort') || 'popular'
    },
    pagination: {
      currentPage: parseInt(params.get('page') || '1'),
      totalPages: 1,
      totalItems: 0
    }
  });

  // Mounting effect
  useEffect(() => {
    setIsMounted(true);
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Fetch data function
  const fetchData = useCallback(async () => {
    if (!isMounted) return;

    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const queryParams = new URLSearchParams({
        type: state.activeTab,
        ...state.filters,
        page: state.pagination.currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString()
      });

      const response = await fetch(`/api/explore?${queryParams}`);
      const data = await response.json();
      console.log("state",state)
      console.log("query",queryParams)
      console.log("data",data)
      if (!response.ok) throw new Error(data.error);

      setState(prev => ({
        ...prev,
        loading: false,
        items: data.items || [],
        pagination: {
          ...prev.pagination,
          totalPages: data.pagination?.totalPages || 1,
          totalItems: data.pagination?.totalItems || 0
        }
      }));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load content",
        variant: "destructive"
      });
      setState(prev => ({
        ...prev,
        loading: false,
        items: []
      }));
    }
  }, [isMounted, state.activeTab, state.filters, state.pagination.currentPage, toast]);

  // Update URL and fetch data effect
  useEffect(() => {
    if (!isMounted) return;

    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      fetchData();
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      const params = new URLSearchParams();
      params.set('type', state.activeTab);
      
      Object.entries(state.filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.set(key, value);
        }
      });
      
      if (state.pagination.currentPage > 1) {
        params.set('page', state.pagination.currentPage.toString());
      }
      
      router.push(`/explore?${params.toString()}`, { scroll: false });
      fetchData();
    }, 300);

  }, [isMounted, state.activeTab, state.filters, state.pagination.currentPage, router]);

  // Event handlers
  const handleTabChange = useCallback((value) => {
    setState(prev => ({
      ...prev,
      activeTab: value,
      pagination: { ...prev.pagination, currentPage: 1 }
    }));
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, [key]: value },
      pagination: { ...prev.pagination, currentPage: 1 }
    }));
  }, []);

  const handlePageChange = useCallback((page) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, currentPage: page }
    }));
  }, []);

  // Render content function
  const renderContent = useCallback(() => {
    if (state.loading) {
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }
    console.log("state.items?.length", state)
    if (!state.items?.length) {
      return (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-xl font-semibold">No results found</h3>
          <p className="mt-2 text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {state.items.map((item) => (
          <div key={item.id}>
            {state.activeTab === 'courses' ? (
              <CourseCard
                course={item}
                onClick={() => router.push(`/courses/${item.id}`)}
              />
            ) : (
              <EventCard
                event={item}
                onClick={() => router.push(`/events/${item.id}`)}
              />
            )}
          </div>
        ))}
      </div>
    );
  }, [state.loading, state.items, state.activeTab, router]);
  // Prevent SSR hydration issues
  if (!isMounted) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Explore</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover high-quality courses and events in medical, dental, and nursing domains
        </p>
      </div>

      <Tabs 
        defaultValue={state.activeTab}
        value={state.activeTab}
        onValueChange={handleTabChange}
        className="space-y-8"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <TabsList>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${state.activeTab}...`}
                className="pl-9"
                value={state.filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>

          <Select
            value={state.filters.sort}
            onValueChange={(value) => handleFilterChange('sort', value)}
          >
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(option => (
                <SelectItem key={`sort-${option.value}`} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          <Select
            value={state.filters.category}
            onValueChange={(value) => handleFilterChange('category', value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(category => (
                <SelectItem key={`cat-${category.toLowerCase()}`} value={category.toLowerCase()}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={state.filters.department}
            onValueChange={(value) => handleFilterChange('department', value)}
          >
            <SelectTrigger className="w-[180px]">
              <GraduationCap className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {CATEGORIES.map(category => (
                <SelectItem key={`dept-${category.toLowerCase()}`} value={category.toLowerCase()}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {state.activeTab === 'courses' ? (
            <Select
              value={state.filters.level}
              onValueChange={(value) => handleFilterChange('level', value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {COURSE_LEVELS.map(level => (
                  <SelectItem key={`level-${level.toLowerCase()}`} value={level.toLowerCase()}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <>
              <Select
                value={state.filters.eventType}
                onValueChange={(value) => handleFilterChange('eventType', value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {EVENT_TYPES.map(type => (
                    <SelectItem key={`type-${type.toLowerCase()}`} value={type.toLowerCase()}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={state.filters.timeframe}
                onValueChange={(value) => handleFilterChange('timeframe', value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming Events</SelectItem>
                  <SelectItem value="past">Past Events</SelectItem>
                  <SelectItem value="all">All Events</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>

        <TabsContent value="courses" className="mt-0">
          {renderContent()}
        </TabsContent>

        <TabsContent value="events" className="mt-0">
          {renderContent()}
        </TabsContent>

        {/* Pagination */}
        {!state.loading && state.pagination.totalPages > 1 && (
          <div className="flex justify-center mt-8 gap-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(state.pagination.currentPage - 1)}
              disabled={state.pagination.currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {Array.from({ length: state.pagination.totalPages }).map((_, i) => {
              const page = i + 1;
              if (
                page === 1 ||
                page === state.pagination.totalPages ||
                (page >= state.pagination.currentPage - 1 &&
                  page <= state.pagination.currentPage + 1)
              ) {
                return (
                  <Button
                    key={`page-${page}`}
                    variant={state.pagination.currentPage === page ? "default" : "outline"}
                    onClick={() => handlePageChange(page)}
                    className="min-w-[2.5rem]"
                  >
                    {page}
                  </Button>
                );
              }
              if (
                page === state.pagination.currentPage - 2 ||
                page === state.pagination.currentPage + 2
              ) {
                return (
                  <span
                    key={`dots-${page}`}
                    className="px-2 py-2 text-muted-foreground"
                  >
                    ...
                  </span>
                );
              }
              return null;
            })}

            <Button
              variant="outline"
              onClick={() => handlePageChange(state.pagination.currentPage + 1)}
              disabled={state.pagination.currentPage === state.pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </Tabs>
    </div>
  );
}