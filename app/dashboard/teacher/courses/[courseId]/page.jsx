"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/accordion";
import { useToast } from "@/app/components/ui/use-toast";
import {
  ArrowLeft,
  Users,
  Clock,
  DollarSign,
  Loader2,
} from "lucide-react";

// --- Static mock courses for fallback ---
const mockCourses = [
  {
    _id: "1",
    title: "Beginner Chess Fundamentals",
    description:
      "Learn the basics of chess, including piece movement, rules, and opening principles.",
    category: "Chess",
    level: "Beginner",
    thumbnail: "https://via.placeholder.com/800x450?text=Beginner+Chess",
    price: 49.99,
    enrollments: 120,
    totalDuration: 180,
    rating: 4.8,
    status: "published",
    sections: [
      {
        title: "Introduction to Chess",
        lessons: [
          { id: "l1", title: "How the Pieces Move", duration: 10 },
          { id: "l2", title: "Basic Rules", duration: 15 },
        ],
      },
      {
        title: "Opening Principles",
        lessons: [
          { id: "l3", title: "Control the Center", duration: 12 },
          { id: "l4", title: "Develop Your Pieces", duration: 14 },
        ],
      },
    ],
    objectives: ["Understand piece movement", "Learn basic chess rules"],
    requirements: ["No prior knowledge required"],
    students: [
      {
        _id: "s1",
        name: "John Doe",
        email: "john@example.com",
        enrolledAt: "2025-07-01",
        progress: 75,
        lastActive: "2025-08-01",
      },
      {
        _id: "s2",
        name: "Jane Smith",
        email: "jane@example.com",
        enrolledAt: "2025-07-05",
        progress: 40,
        lastActive: "2025-08-02",
      },
    ],
    reviews: [],
    discussions: [],
  },
];

export default function CourseDetails({ params }) {
  const router = useRouter();
  const { toast } = useToast();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const resolvedParams = use(params);
  const courseId = resolvedParams.courseId;

  useEffect(() => {
    if (courseId) {
      checkAuthAndFetch();
    }
  }, [courseId]);

  const checkAuthAndFetch = async () => {
    try {
      const res = await fetch("/api/auth/check", { credentials: "include" });

      if (!res.ok) {
        router.push("/auth/teacher/login");
        return;
      }

      const data = await res.json();
      if (data.user?.role !== "teacher") {
        router.push("/dashboard");
        return;
      }

      await fetchCourseDetails();
    } catch (error) {
      console.error("Auth check failed:", error);
      router.push("/auth/teacher/login");
    }
  };

  const fetchCourseDetails = async () => {
    console.log("DEBUG: courseId param =", courseId);
    console.log("DEBUG: mock IDs =", mockCourses.map((c) => c._id));

    try {
      const response = await fetch(`/api/teacher/courses/${courseId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) throw new Error("API returned an error");

      const data = await response.json();

      if (data?.course) {
        console.log("DEBUG: API course loaded");
        setCourse(data.course);
      } else {
        console.log("DEBUG: API returned no course, using mock");
        const mock = mockCourses.find((c) => String(c._id) === String(courseId ?? ""));
        setCourse(mock || null);
      }
    } catch (error) {
      console.error("Error fetching course details:", error);
      console.log("DEBUG: Using mock fallback because API failed");
      const mock = mockCourses.find((c) => String(c._id) === String(courseId ?? ""));
      setCourse(mock || null);

      toast({
        title: "Error",
        description: "Failed to fetch course details. Showing sample data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-xl font-semibold mb-2">Course not found</h2>
        <Button onClick={() => router.push("/dashboard/teacher/courses")}>
          Return to Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-start space-x-4">
          <Button variant="ghost" onClick={() => router.push("/dashboard/teacher/courses")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Courses
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{course.title}</h1>
            <div className="flex items-center space-x-2 mt-2">
              <Badge>{course.status}</Badge>
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="h-4 w-4 mr-1" /> {course.enrollments} students
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" /> {formatDuration(course.totalDuration)}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4 mr-1" /> ${course.price}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="students">Students ({course.students?.length || 0})</TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Course Content</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                {course.sections?.map((section, i) => (
                  <AccordionItem key={i} value={`section-${i}`}>
                    <AccordionTrigger>
                      <div className="flex items-center justify-between w-full">
                        <span>{section.title}</span>
                        <Badge variant="secondary">{section.lessons.length} lessons</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {section.lessons.map((lesson, j) => (
                        <div key={j} className="flex items-center justify-between py-1">
                          <span>{lesson.title}</span>
                          <span className="text-sm text-muted-foreground">
                            {lesson.duration} mins
                          </span>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Students</CardTitle>
            </CardHeader>
            <CardContent>
              {course.students?.length > 0 ? (
                <table className="w-full border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Enrolled</th>
                      <th className="px-4 py-2 text-left">Progress</th>
                      <th className="px-4 py-2 text-left">Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {course.students.map((s) => (
                      <tr key={s._id} className="border-t">
                        <td className="px-4 py-2">{s.name}</td>
                        <td className="px-4 py-2">{s.email}</td>
                        <td className="px-4 py-2">{s.enrolledAt}</td>
                        <td className="px-4 py-2">{s.progress}%</td>
                        <td className="px-4 py-2">{s.lastActive}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No students enrolled yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
