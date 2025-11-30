// components/dashboard/student/ProgressChart.jsx
"use client"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
  } from "recharts";
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
  
  const data = [
    { week: "Week 1", hoursSpent: 5, progress: 15, performance: 82 },
    { week: "Week 2", hoursSpent: 8, progress: 30, performance: 85 },
    { week: "Week 3", hoursSpent: 6, progress: 45, performance: 88 },
    { week: "Week 4", hoursSpent: 10, progress: 65, performance: 90 },
    { week: "Week 5", hoursSpent: 7, progress: 80, performance: 87 },
    { week: "Week 6", hoursSpent: 9, progress: 95, performance: 92 },
  ];
  
  export function ProgressChart() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Learning Progress Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="hoursSpent"
                  stroke="#8884d8"
                  name="Hours Spent"
                />
                <Line
                  type="monotone"
                  dataKey="progress"
                  stroke="#82ca9d"
                  name="Progress %"
                />
                <Line
                  type="monotone"
                  dataKey="performance"
                  stroke="#ffc658"
                  name="Performance %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  }