"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  Loader2, Book, Users, Calendar, DollarSign,
  Upload, MessageSquare
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

export default function TeacherDashboard() {
  const router = useRouter();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeCourses: 0,
    upcomingClasses: 0,
    totalEarnings: 0
  });

  const [recentClasses, setRecentClasses] = useState([]);

  useEffect(() => {
    const loadStaticData = async () => {
      try {
        // Static profile and stats data
        const profileData = { teacher: { name: "John Doe" } };
        const statsData = {
          totalStudents: 120,
          activeCourses: 5,
          upcomingClasses: 3,
          totalEarnings: 4500
        };
        const recentClassesData = [
          {
            id: '1',
            title: 'Opening Principles in Chess',
            date: '2025-08-04',
            time: '10:00 AM'
          },
          {
            id: '2',
            title: 'Tactics & Strategy',
            date: '2025-08-03',
            time: '2:30 PM'
          },
          {
            id: '3',
            title: 'Endgame Basics',
            date: '2025-08-01',
            time: '4:00 PM'
          }
        ];

        setTeacher(profileData.teacher);
        setStats(statsData);
        setRecentClasses(recentClassesData);
      } catch (error) {
        setError("Something went wrong while loading static data.");
      } finally {
        setLoading(false);
      }
    };

    loadStaticData();
  }, []);

  const handleUpload = (type) => {
    if (type === 'live') {
      router.push('/dashboard/teacher/livestreams');
    } else {
      router.push('/dashboard/teacher/courses/create');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-500">Error: {error}</p>
        <Button onClick={() => router.push('/auth/teacher/login')}>
          Return to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back, {teacher?.name}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Content
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleUpload('live')}>
              Go Live
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleUpload('recorded')}>
              Upload Course
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCourses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalEarnings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingClasses}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button 
          variant="outline"
          className="h-24 flex flex-col items-center justify-center space-y-2"
          onClick={() => router.push('/dashboard/teacher/courses/create')}
        >
          <Book className="h-6 w-6" />
          <span>Create Course</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-24 flex flex-col items-center justify-center space-y-2"
          onClick={() => router.push('/dashboard/teacher/assignments')}
        >
          <Calendar className="h-6 w-6" />
          <span>Create Assignment</span>
        </Button>
        <Button 
          variant="outline"
          className="h-24 flex flex-col items-center justify-center space-y-2"
          onClick={() => router.push('/dashboard/teacher/discussions')}
        >
          <MessageSquare className="h-6 w-6" />
          <span>Start Discussion</span>
        </Button>
        <Button 
          variant="outline"
          className="h-24 flex flex-col items-center justify-center space-y-2"
          onClick={() => router.push('/dashboard/teacher/students')}
        >
          <Users className="h-6 w-6" />
          <span>Manage Students</span>
        </Button>
      </div>

      {/* Recent Classes Section */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Classes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentClasses.length > 0 ? (
            <ul className="divide-y">
              {recentClasses.map((cls) => (
                <li key={cls.id} className="py-3 flex justify-between">
                  <div>
                    <p className="font-medium">{cls.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(cls.date).toLocaleDateString()} • {cls.time}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => router.push(`/dashboard/teacher/courses/${cls.id}`)}
                  >
                    View
                  </Button>
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
