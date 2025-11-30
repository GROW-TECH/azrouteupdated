// components/dashboard/UpcomingDeadlines.jsx
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { Calendar, AlertCircle } from "lucide-react";

export function UpcomingDeadlines() {
  const deadlines = [
    {
      id: 1,
      title: "React Components Project",
      dueDate: "Oct 31, 2024",
      progress: 75,
      priority: "high",
      course: "Advanced Web Development",
    },
    {
      id: 2,
      title: "Database Design Assignment",
      dueDate: "Nov 2, 2024",
      progress: 30,
      priority: "medium",
      course: "Database Systems",
    },
    {
      id: 3,
      title: "API Integration Exercise",
      dueDate: "Nov 5, 2024",
      progress: 0,
      priority: "low",
      course: "Backend Development",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Deadlines</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {deadlines.map((deadline) => (
            <div
              key={deadline.id}
              className="space-y-2 p-4 border rounded-lg"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{deadline.title}</h4>
                {deadline.priority === 'high' && (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">{deadline.course}</p>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Due {deadline.dueDate}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{deadline.progress}%</span>
                </div>
                <Progress value={deadline.progress} className="h-2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}