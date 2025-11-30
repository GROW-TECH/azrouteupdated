//components/livestream/StreamStatistics.jsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Users,
  MessageSquare,
  Clock,
  TrendingUp,
  Activity,
  RefreshCcw
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">
        {title}
      </CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {trend && (
        <p className="text-xs text-muted-foreground">
          <TrendingUp className="h-4 w-4 inline mr-1" />
          {trend}% from last period
        </p>
      )}
    </CardContent>
  </Card>
);

export function StreamStatistics({ streamId }) {
  const [timeRange, setTimeRange] = useState('1h');
  const [stats, setStats] = useState(null);
  const [realtimeStats, setRealtimeStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch initial statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(
          `/api/livestreams/${streamId}/analytics?timeRange=${timeRange}`
        );
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching statistics:', error);
      }
    };

    fetchStats();
  }, [streamId, timeRange]);

  // Real-time stats polling
  useEffect(() => {
    if (!autoRefresh) return;

    const pollStats = async () => {
      try {
        const response = await fetch(
          `/api/livestreams/${streamId}/analytics`,
          { method: 'POST' }
        );
        if (response.ok) {
          const data = await response.json();
          setRealtimeStats(data);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error polling stats:', error);
      }
    };

    pollStats();
    const interval = setInterval(pollStats, 5000);

    return () => clearInterval(interval);
  }, [streamId, autoRefresh]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <Select
          value={timeRange}
          onValueChange={setTimeRange}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">Last Hour</SelectItem>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setAutoRefresh(!autoRefresh)}
        >
          <RefreshCcw className={cn(
            "h-4 w-4 mr-2",
            autoRefresh && "animate-spin"
          )} />
          {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Current Viewers"
          value={realtimeStats?.currentViewers || 0}
          icon={Users}
          trend={((realtimeStats?.currentViewers - stats?.viewerStats.peak) / stats?.viewerStats.peak * 100).toFixed(1)}
        />
        <StatCard
          title="Peak Viewers"
          value={stats?.viewerStats.peak || 0}
          icon={TrendingUp}
        />
        <StatCard
          title="Total Views"
          value={stats?.viewerStats.total || 0}
          icon={Activity}
        />
        <StatCard
          title="Avg. Watch Time"
          value={`${Math.round(stats?.interactionStats.avgWatchTime || 0)}m`}
          icon={Clock}
        />
      </div>

      {/* Viewer Retention Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Viewer Retention</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={Object.entries(stats?.retentionData || {}).map(([time, count]) => ({
                time: `${time}m`,
                viewers: count
              }))}>
                <defs>
                  <linearGradient id="colorViewers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="viewers"
                  stroke="#0ea5e9"
                  fillOpacity={1}
                  fill="url(#colorViewers)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Interaction Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Message Rate Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Message Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={realtimeStats?.chatActivity || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="messages"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Score Card */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-[200px]">
              <div className="text-6xl font-bold text-primary">
                {stats?.engagementScore || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Based on viewer interactions and watch time
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interaction Details */}
      <Card>
        <CardHeader>
          <CardTitle>Interaction Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Chat Activity */}
            <div>
              <h4 className="text-sm font-medium mb-2">Chat Activity</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-bold">
                    {stats?.participationStats.totalMessages || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Messages</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {Math.round((realtimeStats?.messageRate || 0) * 60)}
                  </p>
                  <p className="text-sm text-muted-foreground">Messages/Hour</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stats?.participationStats.totalQuestions || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Questions Asked</p>
                </div>
              </div>
            </div>

            {/* Viewer Activity */}
            <div>
              <h4 className="text-sm font-medium mb-2">Viewer Activity</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-bold">
                    {realtimeStats?.participantMetrics.newJoins || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">New Joins (5m)</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {realtimeStats?.activeParticipants || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Active Viewers</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {Math.round(realtimeStats?.participantMetrics.avgWatchTime || 0)}m
                  </p>
                  <p className="text-sm text-muted-foreground">Avg. Session</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}