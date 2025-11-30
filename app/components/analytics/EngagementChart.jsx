// components/analytics/EngagementChart.jsx
"use client"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
  } from 'recharts';
  
  export function EngagementChart() {
    const data = [
      { month: 'Jan', views: 65, completion: 45, participation: 80 },
      { month: 'Feb', views: 75, completion: 55, participation: 85 },
      { month: 'Mar', views: 85, completion: 60, participation: 88 },
      { month: 'Apr', views: 82, completion: 63, participation: 90 },
      { month: 'May', views: 88, completion: 68, participation: 92 },
      { month: 'Jun', views: 90, completion: 70, participation: 95 },
    ];
  
    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="views" stroke="#8884d8" name="Content Views" />
          <Line type="monotone" dataKey="completion" stroke="#82ca9d" name="Completion Rate" />
          <Line type="monotone" dataKey="participation" stroke="#ffc658" name="Participation" />
        </LineChart>
      </ResponsiveContainer>
    );
  }