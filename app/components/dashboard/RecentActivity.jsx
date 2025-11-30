// components/dashboard/RecentActivity.jsx
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { BookOpen, MessageSquare, CheckCircle } from "lucide-react";

export function RecentActivity() {
  const activities = [
    {
      id: 1,
      type: "assignment",
      description: "New submission for 'React Fundamentals'",
      time: "2 hours ago",
      icon: BookOpen,
    },
    {
      id: 2,
      type: "discussion",
      description: "New comment in 'State Management' discussion",
      time: "3 hours ago",
      icon: MessageSquare,
    },
    {
      id: 3,
      type: "grade",
      description: "Assignment 'API Integration' graded",
      time: "5 hours ago",
      icon: CheckCircle,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div
                key={activity.id}
                className="flex items-start space-x-4 p-2 rounded-lg hover:bg-accent/5"
              >
                <div className="bg-primary/10 p-2 rounded-full">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">{activity.description}</p>
                  <span className="text-xs text-muted-foreground">
                    {activity.time}
                  </span>
                </div>
                <Badge variant="secondary">{activity.type}</Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}