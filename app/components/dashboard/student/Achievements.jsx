// components/dashboard/student/Achievements.jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Star, Award } from "lucide-react";

const achievements = [
  {
    id: 1,
    title: "Fast Learner",
    description: "Completed 5 courses in one month",
    icon: Trophy,
    date: "2024-10-15",
    type: "milestone",
  },
  {
    id: 2,
    title: "Perfect Score",
    description: "Achieved 100% in course assessment",
    icon: Medal,
    date: "2024-10-20",
    type: "achievement",
  },
  {
    id: 3,
    title: "Consistent Learner",
    description: "15-day learning streak",
    icon: Star,
    date: "2024-10-25",
    type: "streak",
  },
  {
    id: 4,
    title: "Course Master",
    description: "Completed Advanced Web Development",
    icon: Award,
    date: "2024-10-28",
    type: "certificate",
  },
];

export function Achievements() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {achievements.map((achievement) => {
        const Icon = achievement.icon;
        return (
          <Card key={achievement.id} className="group hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{achievement.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {achievement.description}
                </p>
              </div>
              <Badge className="ml-auto" variant={
                achievement.type === 'milestone' ? 'default' :
                achievement.type === 'achievement' ? 'secondary' :
                achievement.type === 'streak' ? 'outline' : 'destructive'
              }>
                {achievement.type}
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Earned on {new Date(achievement.date).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  );
}