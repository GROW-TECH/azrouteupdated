// components/dashboard/UpcomingClasses.jsx
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Calendar, Clock, Users } from "lucide-react";

export function UpcomingClasses() {
  const classes = [
    {
      id: 1,
      title: "React Advanced Concepts",
      time: "10:00 AM",
      date: "Today",
      duration: "1 hour",
      students: 25,
    },
    {
      id: 2,
      title: "State Management Workshop",
      time: "2:00 PM",
      date: "Tomorrow",
      duration: "1.5 hours",
      students: 18,
    },
    {
      id: 3,
      title: "API Design Principles",
      time: "11:00 AM",
      date: "Oct 31",
      duration: "1 hour",
      students: 22,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Classes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {classes.map((classItem) => (
            <div
              key={classItem.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="space-y-1">
                <h4 className="font-medium">{classItem.title}</h4>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{classItem.date}</span>
                  <Clock className="h-4 w-4 ml-3 mr-1" />
                  <span>{classItem.time}</span>
                  <Users className="h-4 w-4 ml-3 mr-1" />
                  <span>{classItem.students} students</span>
                </div>
              </div>
              <Button size="sm">Join Class</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
