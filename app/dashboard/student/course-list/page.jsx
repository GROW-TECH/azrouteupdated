"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../../../components/ui/card";
import { useRouter } from "next/navigation";

export default function CourseListPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchCourses() {
      // ✅ Fetch all students and their courses from Supabase
      const { data, error } = await supabase
        .from("student_list")
        .select("course, level")
        .not("course", "is", null);

      if (error) {
        console.error("Error fetching courses:", error);
        setLoading(false);
        return;
      }

      // ✅ Count how many students belong to each course
      const courseCounts = data.reduce((acc, cur) => {
        acc[cur.course] = (acc[cur.course] || 0) + 1;
        return acc;
      }, {});

      // ✅ Extract unique course info
      const uniqueCourses = Array.from(new Set(data.map((s) => s.course))).map(
        (courseName, index) => ({
          id: index + 1,
          title: courseName,
          description: `Learn all about ${courseName} and improve your chess skills.`,
          level: data.find((s) => s.course === courseName)?.level || "Beginner",
          price: "N/A",
          studentCount: courseCounts[courseName] || 0,
        })
      );

      setCourses(uniqueCourses);
      setLoading(false);
    }

    fetchCourses();
  }, []);

  if (loading) {
    return <p className="text-center mt-10 text-gray-500">Loading courses...</p>;
  }

  if (courses.length === 0) {
    return <p className="text-center mt-10 text-gray-500">No courses available.</p>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">
        Available Courses
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card
            key={course.id}
            className="hover:shadow-lg transition-shadow border border-gray-200"
          >
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-primary">
                {course.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">{course.description}</p>
              <p className="text-xs text-gray-500">Level: {course.level}</p>
              <p className="text-xs text-gray-500">
                Students Enrolled: {course.studentCount}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant="default"
                className="w-full"
                onClick={() =>
                  router.push(`/dashboard/student/courses/${course.title}`)
                }
              >
                View Course
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
