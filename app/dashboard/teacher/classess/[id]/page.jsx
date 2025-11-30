"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Book, Video } from "lucide-react";

export default function TeacherDashboardMain() {
  const router = useRouter();

  // Static sample data (replace with API in future)
  const [recentClasses, setRecentClasses] = useState([
    {
      id: "1",
      title: "Opening Principles in Chess",
      date: "2025-08-05",
      time: "10:00 AM - 11:00 AM",
      students: 20,
      meetLink: "https://meet.google.com/example",
    },
    {
      id: "2",
      title: "Middle Game Tactics",
      date: "2025-08-07",
      time: "2:00 PM - 3:00 PM",
      students: 15,
      meetLink: "https://meet.google.com/example2",
    },
  ]);

  return (
    <div className="p-6 space-y-6">
      {/* Top Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">120</div>
            <p className="text-xs text-muted-foreground">Enrolled in all courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Next 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Sessions</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Scheduled</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent/Upcoming Classes */}
      <Card>
        <CardHeader>
          <CardTitle>Recent & Upcoming Classes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentClasses.length > 0 ? (
            <ul className="divide-y">
              {recentClasses.map((cls) => (
                <li
                  key={cls.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-lg">{cls.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(cls.date).toLocaleDateString()} • {cls.time}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {cls.students} students enrolled
                    </p>
                  </div>
                  <div className="mt-3 sm:mt-0 flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/dashboard/teacher/classes/${cls.id}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      onClick={() => window.open(cls.meetLink, "_blank")}
                    >
                      Go to Meet
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">
              No recent classes found.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
