// app/dashboard/teacher/courses/[courseId]/analytics/page.jsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useToast } from "@/components/ui/use-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Star,
  Clock,
  BookOpen,
  ArrowLeft,
  Download,
  Video,
  MessageSquare
} from "lucide-react";

// Color constants for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const PRIMARY_COLOR = '#8884d8';
const SECONDARY_COLOR = '#82ca9d';

export default async function  CourseAnalytics({ params }) {
  const router = useRouter();
  const { courseId } =await  params;
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [analytics, setAnalytics] = useState({
    completion: { totalEnrolled: 0, inProgress: 0, completed: 0 },
    enrollmentTrend: [],
    revenueTrend: [],
    engagement: [],
    reviews: { averageRating: 0, totalReviews: 0, distribution: {} },
    progressDistribution: { quarter1: 0, quarter2: 0, quarter3: 0, quarter4: 0 }
  });
  const [course, setCourse] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, courseId]);

  const fetchAnalytics = async () => {
    try {
      const [analyticsRes, courseRes] = await Promise.all([
        fetch(`/api/teacher/courses/${courseId}/analytics?range=${timeRange}`),
        fetch(`/api/teacher/courses/${courseId}`)
      ]);

      if (!analyticsRes.ok || !courseRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [analyticsData, courseData] = await Promise.all([
        analyticsRes.json(),
        courseRes.json()
      ]);

      setAnalytics(analyticsData);
      setCourse(courseData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadAnalytics = () => {
    if (!analytics) return;

    // Create CSV content
    const csvContent = [
      // Headers
      ['Date', 'Enrollments', 'Revenue', 'Engagement', 'Completions'].join(','),
      // Data rows
      ...analytics.enrollmentTrend.map(day => [
        day._id,
        day.count,
        analytics.revenueTrend.find(r => r._id === day._id)?.total || 0,
        analytics.engagement.find(e => e._id === day._id)?.totalViews || 0,
        analytics.lessonEngagement.find(l => l._id === day._id)?.completions || 0
      ].join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `course-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/dashboard/teacher/courses')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{course?.title}</h1>
            <p className="text-muted-foreground">
              Course Analytics and Insights
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Select
            value={timeRange}
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={downloadAnalytics}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.completion.totalEnrolled}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-4 w-4 mr-1" />
              {analytics.completion.inProgress} active learners
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analytics.revenueTrend.reduce((sum, day) => sum + (day.total || 0), 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              During selected period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((analytics.completion.completed / analytics.completion.totalEnrolled) * 100 || 0).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">
              {analytics.completion.completed} completions
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.reviews.averageRating.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">
              From {analytics.reviews.totalReviews} reviews
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Enrollment Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.enrollmentTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="_id"
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={PRIMARY_COLOR}
                    name="Enrollments"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="_id"
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke={SECONDARY_COLOR}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Student Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.engagement}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="_id"
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="totalViews"
                    stroke="#0088FE"
                    name="Views"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="totalComments"
                    stroke="#00C49F"
                    name="Comments"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgTimeSpent"
                    stroke="#FFBB28"
                    name="Avg. Time (min)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(analytics.reviews.distribution).map(([rating, count]) => ({
                      name: `${rating} Star${count !== 1 ? 's' : ''}`,
                      value: count
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {Object.entries(analytics.reviews.distribution).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Progress Summary */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Student Progress Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-secondary/10 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Not Started</h4>
                <div className="text-2xl font-bold">
                  {analytics.completion.totalEnrolled - 
                    (analytics.completion.inProgress + analytics.completion.completed)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Students yet to begin
                </p>
              </div>
              
              <div className="bg-primary/10 p-4 rounded-lg">
                <h4 className="font-medium mb-2">In Progress</h4>
                <div className="text-2xl font-bold">
                  {analytics.completion.inProgress}
                </div>
                <p className="text-sm text-muted-foreground">
                  Actively learning
                </p>
              </div>
              
              <div className="bg-green-100 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Completed</h4>
                <div className="text-2xl font-bold">
                  {analytics.completion.completed}
                </div>
                <p className="text-sm text-muted-foreground">
                  Finished the course
                </p>
              </div>
            </div>

            {/* Progress Distribution Bars */}
            <div className="mt-8 space-y-4">
              <h4 className="font-medium mb-4">Progress Distribution</h4>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">0-25% Complete</p>
                  <span className="text-sm text-muted-foreground">
                    {analytics.progressDistribution?.quarter1 || 0} students
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${((analytics.progressDistribution?.quarter1 || 0) / 
                        analytics.completion.totalEnrolled * 100)}%` 
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">26-50% Complete</p>
                  <span className="text-sm text-muted-foreground">
                    {analytics.progressDistribution?.quarter2 || 0} students
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-600 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${((analytics.progressDistribution?.quarter2 || 0) / 
                        analytics.completion.totalEnrolled * 100)}%` 
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">51-75% Complete</p>
                  <span className="text-sm text-muted-foreground">
                    {analytics.progressDistribution?.quarter3 || 0} students
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-600 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${((analytics.progressDistribution?.quarter3 || 0) / 
                        analytics.completion.totalEnrolled * 100)}%` 
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">76-100% Complete</p>
                  <span className="text-sm text-muted-foreground">
                    {analytics.progressDistribution?.quarter4 || 0} students
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-600 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${((analytics.progressDistribution?.quarter4 || 0) / 
                        analytics.completion.totalEnrolled * 100)}%` 
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Activity Summary */}
            <div className="mt-8">
              <h4 className="font-medium mb-4">Activity Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Video className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Video Views</p>
                    <p className="text-2xl font-bold">
                      {analytics.engagement.reduce((sum, day) => sum + (day.totalViews || 0), 0)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total Comments</p>
                    <p className="text-2xl font-bold">
                      {analytics.engagement.reduce((sum, day) => sum + (day.totalComments || 0), 0)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Avg. Time/Session</p>
                    <p className="text-2xl font-bold">
                      {Math.round(
                        analytics.engagement.reduce((sum, day) => sum + (day.avgTimeSpent || 0), 0) / 
                        analytics.engagement.length
                      )} min
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )};