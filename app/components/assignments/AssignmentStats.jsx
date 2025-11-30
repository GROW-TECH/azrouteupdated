// components/assignments/AssignmentStats.jsx
"use client"
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
  } from "recharts";
  import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
  
  export function AssignmentStats() {
    const submissionData = [
      { week: "Week 1", onTime: 85, late: 10, missing: 5 },
      { week: "Week 2", onTime: 80, late: 15, missing: 5 },
      { week: "Week 3", onTime: 90, late: 8, missing: 2 },
      { week: "Week 4", onTime: 82, late: 12, missing: 6 },
      { week: "Week 5", onTime: 88, late: 10, missing: 2 },
    ];
  
    const gradeDistribution = [
      { range: "90-100", count: 15 },
      { range: "80-89", count: 25 },
      { range: "70-79", count: 12 },
      { range: "60-69", count: 8 },
      { range: "Below 60", count: 5 },
    ];
  
    return (
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Submission Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={submissionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="onTime" stroke="#8884d8" name="On Time" />
                <Line type="monotone" dataKey="late" stroke="#82ca9d" name="Late" />
                <Line type="monotone" dataKey="missing" stroke="#ff7300" name="Missing" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
  
        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  }