// components/analytics/CourseAnalytics.jsx
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { EngagementChart } from "./EngagementChart";
import { PerformanceMetrics } from "./PerformanceMetrics";
import { StudentProgress } from "./StudentProgress";
import { CourseFeedback } from "./CourseFeedback";
import { Users, Clock, BookOpen, Target } from "lucide-react";

export function CourseAnalytics({ courseId }) {
  // In a real app, fetch this data from your API
  const courseStats = {
    totalStudents: 156,
    averageEngagement: 78,
    completionRate: 65,
    averageScore: 82
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courseStats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              +12 from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Engagement</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courseStats.averageEngagement}%</div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courseStats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              +2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courseStats.averageScore}%</div>
            <p className="text-xs text-muted-foreground">
              +3% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="engagement" className="w-full">
        <TabsList>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="progress">Student Progress</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>
        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle>Student Engagement Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <EngagementChart />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="performance">
          <PerformanceMetrics />
        </TabsContent>
        <TabsContent value="progress">
          <StudentProgress />
        </TabsContent>
        <TabsContent value="feedback">
          <CourseFeedback />
        </TabsContent>
      </Tabs>
    </div>
  );
}
