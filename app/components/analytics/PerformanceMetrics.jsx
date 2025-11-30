// components/analytics/PerformanceMetrics.jsx
"use client"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
  } from 'recharts';
  import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
  
  export function PerformanceMetrics() {
    const assignmentData = [
      { name: 'Assignment 1', avgScore: 85, submissions: 95 },
      { name: 'Assignment 2', avgScore: 78, submissions: 88 },
      { name: 'Assignment 3', avgScore: 92, submissions: 82 },
      { name: 'Assignment 4', avgScore: 88, submissions: 85 },
      { name: 'Quiz 1', avgScore: 76, submissions: 90 },
      { name: 'Final Project', avgScore: 90, submissions: 78 },
    ];
  
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assignment Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={assignmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgScore" fill="#8884d8" name="Average Score" />
              <Bar dataKey="submissions" fill="#82ca9d" name="Submission Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }