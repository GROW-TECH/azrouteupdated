"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/components/auth/useAuth';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrev,
  PaginationNext,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  Calendar,
  Search,
  Filter,
  Book,
  Users,
  Globe,
  Lock
} from 'lucide-react';

export default function StreamSearchPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <StreamSearchContent />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

function StreamSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  // Search state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [type, setType] = useState(searchParams.get('type') || 'all');
  const [courseId, setCourseId] = useState(searchParams.get('course') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);

  // Results state
  const [streams, setStreams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch available courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses');
        if (response.ok) {
          const data = await response.json();
          setCourses(data.courses);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };

    if (!loading && user) {
      fetchCourses();
    }
  }, [user, loading]);

  // Search streams
  useEffect(() => {
    const searchStreams = async () => {
      try {
        setIsLoading(true);
        const queryParams = new URLSearchParams({
          q: debouncedSearch,
          type,
          page: page.toString()
        });

        if (courseId) {
          queryParams.append('course', courseId);
        }

        const response = await fetch(`/api/livestreams/search?${queryParams}`);
        if (response.ok) {
          const data = await response.json();
          setStreams(data.streams);
          setPagination(data.pagination);
        }
      } catch (error) {
        console.error('Error searching streams:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!loading && user) {
      searchStreams();
    }
  }, [debouncedSearch, type, courseId, page, user, loading]);

  // Update URL with search params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (type !== 'all') params.set('type', type);
    if (courseId) params.set('course', courseId);
    if (page > 1) params.set('page', page.toString());

    router.replace(`/livestreams/search?${params.toString()}`);
  }, [searchQuery, type, courseId, page]);

  const handleJoinStream = (stream) => {
    router.push(`/livestream/${stream.id}`);
  };

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Search Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Find Live Classes</h1>
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard')}
        >
          Back to Dashboard
        </Button>
      </div>

      {/* Search Controls */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search streams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Streams</SelectItem>
              <SelectItem value="live">Live Now</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger className="w-60">
              <SelectValue placeholder="Filter by course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Courses</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course._id} value={course._id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {pagination?.total} Results
          </h2>
        </div>

        {isLoading ? (
          <LoadingFallback />
        ) : streams.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-96">
              <Video className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No streams found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {streams.map((stream) => (
              <Card key={stream.id} className="hover:bg-secondary/5">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant={stream.status === 'live' ? 'destructive' : 'secondary'}>
                      {stream.status === 'live' ? 'Live Now' : 'Scheduled'}
                    </Badge>
                    {stream.isPublic ? (
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <CardTitle className="line-clamp-1">{stream.title}</CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>by {stream.teacherName}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {stream.description}
                  </p>

                  <div className="space-y-2">
                    {stream.courseName && (
                      <div className="flex items-center text-sm">
                        <Book className="h-4 w-4 mr-2" />
                        {stream.courseName}
                      </div>
                    )}
                    <div className="flex items-center text-sm">
                      {stream.status === 'live' ? (
                        <>
                          <Users className="h-4 w-4 mr-2" />
                          {stream.statistics?.currentViewers || 0} viewers
                        </>
                      ) : (
                        <>
                          <Calendar className="h-4 w-4 mr-2" />
                          {new Date(stream.scheduledFor).toLocaleString()}
                        </>
                      )}
                    </div>
                  </div>

                  {stream.canJoin && (
                    <Button
                      className="w-full mt-4"
                      onClick={() => handleJoinStream(stream)}
                      disabled={stream.status !== 'live'}
                    >
                      {stream.status === 'live' ? 'Join Stream' : 'View Details'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationPrev 
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              />
              {Array.from({ length: pagination.pages }, (_, i) => (
                <PaginationItem key={i + 1}>
                  <PaginationLink
                    onClick={() => setPage(i + 1)}
                    isActive={page === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationNext
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.pages}
              />
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}
