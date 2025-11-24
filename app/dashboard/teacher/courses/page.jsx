'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { Badge } from "@/app/components/ui/badge";
import { Skeleton } from "@/app/components/ui/skeleton";
import { useToast } from "@/app/components/ui/use-toast";
import { MoreVertical, Edit, Trash2, Eye, Users } from "lucide-react";

// fallback sample used only when API fails
const mockCourses = [
  {
    _id: "1",
    title: "Beginner Chess Fundamentals",
    description: "Learn the basics of chess",
    status: "active",
    enrolledStudents: 0,
  },
];

const UPLOADED_IMAGE_PATH = "/mnt/data/57a37dda-71e8-4e2b-bfa9-294fca3fb3e9.png"; // unused but kept

function CourseCard({ course }) {

  // DIRECTLY use server provided count
  const studentCount = Number(course.student_count ?? 0);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">{course.title}</h3>
                <p className="text-muted-foreground text-sm mb-2">
                  {course.description}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <Badge className="bg-green-600 text-white">
                  {course.status ?? "active"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-sm mt-3">
              <div className="flex items-center text-muted-foreground">
                <Users className="h-4 w-4 mr-2" />
                <span>{studentCount} students</span>
              </div>
            </div>

          </div>
        </div>
      </CardContent>
    </Card>
  );
}


export default function TeacherCourses() {
  const router = useRouter();
  const { toast } = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentCoachName, setCurrentCoachName] = useState(null);

  useEffect(() => {
    loadCoachAndCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  async function loadCoachAndCourses() {
    try {
      setLoading(true);
      const params = new URLSearchParams({ search: searchQuery || "", page: "1", limit: "100" });
      const res = await fetch(`/api/teacher/courses?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed');

      const fetched = Array.isArray(json.courses) ? json.courses : (json?.courses ?? []);
      const normalized = fetched.map(c => ({ ...c, _id: c.id, thumbnail: c.thumbnail || UPLOADED_IMAGE_PATH }));

      setCurrentCoachName(normalized[0]?.coach_name ?? null);
      setCourses(normalized);
    } catch (err) {
      console.error(err);
      setCourses(mockCourses);
      toast({ title: 'Error', description: 'Failed to load courses — showing sample data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = (courseId) => {
    setCourses(prev => prev.filter(c => c._id !== courseId));
    toast({ title: 'Success', description: 'Course deleted successfully' });
  };

  const handleStatusChange = (courseId, newStatus) => {
    setCourses(prev => prev.map(c => c._id === courseId ? { ...c, status: newStatus } : c));
    toast({ title: 'Success', description: `Course ${newStatus} successfully` });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Courses</h1>
          <p className="text-muted-foreground">{currentCoachName ? `Showing courses assigned to ${currentCoachName}` : 'Showing your assigned courses'}</p>
        </div>
      </div>

      {/* Search only */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 mb-6">
        <div className="relative md:col-span-1 lg:col-span-1">
          <Input placeholder="Search courses..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-3" />
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          Array(3).fill(null).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardContent></Card>
          ))
        ) : courses.length > 0 ? (
          courses.map(course => (
            <CourseCard key={course._id} course={course} onDelete={handleDelete} onStatusChange={handleStatusChange} />
          ))
        ) : (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <h3 className="font-semibold text-lg mb-2">No Courses Found</h3>
              <p className="text-muted-foreground mb-4">No courses are assigned to you currently.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
