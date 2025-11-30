// app/dashboard/student/analytics/page.js
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useToast } from "../../components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  Clock,
  Activity,
  MessageSquare,
  Hand,
  Video,
  Calendar
} from "lucide-react";
import { Progress } from "../../components/ui/progress";

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

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];

export default function StudentAnalyticsDashboard() {
  const { toast } = useToast();
  const [period, setPeriod] = useState("30");
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [watchTimeData, setWatchTimeData] = useState([]);
  const [participationData, setParticipationData] = useState([]);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/student/analytics?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');

      const data = await response.json();
      setAnalytics(data);

      // Process data for charts
      const watchTimeByDay = data.watchTimeByDay.map(day => ({
        name: new Date(day.date).toLocaleDateString(),
        minutes: day.watchTime,
        interactions: day.interactions
      }));

      const participation = [
        { name: 'Attendance', value: data.attendanceRate },
        { name: 'Chat Activity', value: data.chatParticipation },
        { name: 'Questions Asked', value: data.questionsAsked },
        { name: 'Hand Raises', value: data.handRaises }
      ];

      setWatchTimeData(watchTimeByDay);
      setParticipationData(participation);

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

  // app/dashboard/student/analytics/page.js (continued)

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
        <h1 className="text-3xl font-bold">Your Learning Analytics</h1>
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Watch Time"
          value={`${Math.round(analytics?.totalWatchTime || 0)}m`}
          icon={Clock}
          description="Across all sessions"
        />
        <StatCard
          title="Engagement Score"
          value={`${Math.round(analytics?.engagementScore || 0)}%`}
          icon={Activity}
          trend={analytics?.engagementTrend}
        />
        <StatCard
          title="Sessions Attended"
          value={analytics?.sessionsAttended || 0}
          icon={Video}
          description={`${analytics?.attendanceRate || 0}% attendance rate`}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="participation">Participation</TabsTrigger>
          <TabsTrigger value="history">Session History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Watch Time Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Watch Time Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={watchTimeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="minutes"
                        stroke="#2563eb"
                        fill="#93c5fd"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Participation Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Participation Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={participationData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                      >
                        {participationData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Chat Participation</span>
                      <span className="font-medium">
                        {analytics?.chatParticipation || 0}%
                      </span>
                    </div>
                    <Progress value={analytics?.chatParticipation || 0} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Questions Asked</span>
                      <span className="font-medium">
                        {analytics?.questionsRate || 0}%
                      </span>
                    </div>
                    <Progress value={analytics?.questionsRate || 0} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Hand Raises</span>
                      <span className="font-medium">
                        {analytics?.handRaiseRate || 0}%
                      </span>
                    </div>
                    <Progress value={analytics?.handRaiseRate || 0} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.recentSessions?.map(session => (
                    <div 
                      key={session._id}
                      className="flex items-center justify-between p-4 bg-secondary/5 rounded-lg"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{session.title}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {session.watchTime}m
                          </div>
                          <div className="flex items-center">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            {session.interactions}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {Math.round(session.engagement)}%
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
          </div>
        </TabsContent>

        <TabsContent value="participation">
          {/* Detailed participation analytics */}
        </TabsContent>

        <TabsContent value="history">
          {/* Session history analytics */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
