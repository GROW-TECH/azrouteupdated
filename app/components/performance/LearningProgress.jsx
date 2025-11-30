// components/performance/LearningProgress.jsx
"use client"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
  } from "recharts";
  import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
  import { Progress } from "../ui/progress";
  
  export function LearningProgress() {
    const progressData = [
      {
        module: "Module 1",
        timeSpent: 12.5,
        completion: 100,
        performance: 92,
      },
      {
        module: "Module 2",
        timeSpent: 10.2,
        completion: 100,
        performance: 88,
      },
      {
        module: "Module 3",
        timeSpent: 8.8,
        completion: 85,
        performance: 90,
      },
      {
        module: "Module 4",
        timeSpent: 6.5,
        completion: 60,
        performance: 85,
      },
      {
        module: "Module 5",
        timeSpent: 3.2,
        completion: 30,
        performance: null,
      },
    ];
  
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Module Progress Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="module" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completion" name="Completion %" fill="#8884d8" />
                <Bar dataKey="performance" name="Performance %" fill="#82ca9d" />
                <Bar dataKey="timeSpent" name="Time Spent (hours)" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
  
        <Card>
          <CardHeader>
            <CardTitle>Learning Time Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {progressData.map((module) => (
                <div key={module.module} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{module.module}</span>
                    <span className="text-muted-foreground">
                      {module.timeSpent} hours spent
                    </span>
                  </div>
                  <Progress value={module.completion} max={100} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{module.completion}% complete</span>
                    {module.performance && <span>Performance: {module.performance}%</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }