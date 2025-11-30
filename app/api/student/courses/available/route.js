"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

export default function AvailableCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch("/api/student/courses/available");
        if (!res.ok) {
          console.error("Failed to fetch courses");
          return;
        }
        const data = await res.json();
        setCourses(data.courses || []);
      } catch (err) {
        console.error("Error fetching courses:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  if (loading) {
    return <p className="text-center py-10">Loading courses...</p>;
  }

  if (courses.length === 0) {
    return <p className="text-center py-10">No available courses found.</p>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Available Courses</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="shadow-md">
            <CardHeader>
              <CardTitle>{course.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">{course.description}</p>
              <p className="text-sm">
                <strong>Level:</strong> {course.level}
              </p>
              <p className="text-sm">
                <strong>Price:</strong> ₹{course.price}
              </p>
              <p className="text-sm">
                <strong>Category:</strong> {course.category || "General"}
              </p>
              <Button className="mt-3 w-full">Enroll Now</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
