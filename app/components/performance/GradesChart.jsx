// components/performance/GradesChart.jsx
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
  import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
  
  export function GradesChart() {
    const gradeData = [
      { week: "Week 1", grade: 85, classAverage: 78 },
      { week: "Week 2", grade: 82, classAverage: 76 },
      { week: "Week 3", grade: 88, classAverage: 77 },
      { week: "Week 4", grade: 85, classAverage: 75 },
      { week: "Week 5", grade: 90, classAverage: 79 },
      { week: "Week 6", grade: 92, classAverage: 80 },
      { week: "Week 7", grade: 88, classAverage: 78 },
      { week: "Week 8", grade: 95, classAverage: 82 },
    ];
  
    return (
      <Card>
        <CardHeader>
          <CardTitle>Grade Progression</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={gradeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="grade"
                stroke="#8884d8"
                name="Your Grade"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="classAverage"
                stroke="#82ca9d"
                name="Class Average"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }