// app/dashboard/teacher/analytics/page.js
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import {
  Users,
  Clock,
  Activity,
  BarChart2,
  Calendar,
  MessageSquare
} from "lucide-react";

const StatCard = ({ title, value, icon: Icon, description, trend }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline space-x-2">
            <h2 className="text-3xl font-bold">{value}</h2>
            {trend && (
              <span className={`text-sm ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            )}
          </div>
        </div>
        <div className="p-3 bg-primary/10 rounded-full">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      )}
    </CardContent>
  </Card>
);

export default function TeacherAnalyticsDashboard() {
  const { toast } = useToast();
  const [period, setPeriod] = useState("30");
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [engagementData, setEngagementData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teacher/analytics?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');

      const data = await response.json();
      setAnalytics(data);

      // Process data for charts
      const engagementByStream = data.streams.map(stream => ({
        name: new Date(stream.startedAt).toLocaleDateString(),
        engagement: stream.engagement.score,
        participants: stream.statistics.totalViews,
        interactions: stream.statistics.totalInteractions
      }));

      const attendanceByDay = data.attendanceByDay.map(day => ({
        name: new Date(day.date).toLocaleDateString(),
        students: day.count,
        avgWatchTime: day.averageWatchTime
      }));

      setEngagementData(engagementByStream);
      setAttendanceData(attendanceByDay);

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={analytics?.totalStudents || 0}
          icon={Users}
          trend={analytics?.studentGrowth}
        />
        <StatCard
          title="Average Watch Time"
          value={`${Math.round(analytics?.averageWatchTime || 0)}m`}
          icon={Clock}
          description="Per student per session"
        />
        <StatCard
          title="Engagement Rate"
          value={`${Math.round(analytics?.averageEngagement || 0)}%`}
          icon={Activity}
          trend={analytics?.engagementTrend}
        />
        <StatCard
          title="Total Sessions"
          value={analytics?.totalSessions || 0}
          icon={Calendar}
          description="Live sessions conducted"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Engagement Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={engagementData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="engagement" 
                        stroke="#2563eb" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Participation by Session */}
            <Card>
              <CardHeader>
                <CardTitle>Participation by Session</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar 
                        dataKey="students" 
                        fill="#2563eb" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.topSessions?.map(session => (
                    <div 
                      key={session._id}
                      className="flex items-center justify-between p-4 bg-secondary/5 rounded-lg"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{session.title}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {session.statistics.totalViews}
                          </div>
                          <div className="flex items-center">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            {session.statistics.totalInteractions}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {Math.round(session.engagement.score)}%
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Engagement
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Student Engagement Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Student Engagement Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.engagementDistribution || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Bar 
                        dataKey="count" 
                        fill="#2563eb" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement">
          {/* More detailed engagement analytics */}
        </TabsContent>

        <TabsContent value="attendance">
          {/* Detailed attendance analytics */}
        </TabsContent>
      </Tabs>
    </div>
  );
}