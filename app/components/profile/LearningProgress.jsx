// components/profile/LearningProgress.jsx
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
  } from "../ui/card";
  import { Progress } from "../ui/progress";
  import { BookOpen, Clock, Trophy, Target } from "lucide-react";
  
  export function LearningProgress({ user }) {
    const enrolledCourses = [
      {
        id: 1,
        title: "Advanced Web Development",
        progress: 75,
        lastAccessed: "2024-10-29",
        timeSpent: "32 hours",
        nextMilestone: "Complete Final Project",
      },
      {
        id: 2,
        title: "React & Next.js Masterclass",
        progress: 45,
        lastAccessed: "2024-10-28",
        timeSpent: "18 hours",
        nextMilestone: "State Management",
      },
    ];
  
    const stats = {
      coursesCompleted: 8,
      totalHours: 156,
      averageScore: 92,
      streak: 15,
    };
  
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Courses Completed
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.coursesCompleted}</div>
              <p className="text-xs text-muted-foreground">
                2 in progress  </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Learning Hours
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours}</div>
            <p className="text-xs text-muted-foreground">
              Total time spent learning
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Score
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageScore}%</div>
            <p className="text-xs text-muted-foreground">
              Across all assessments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Learning Streak
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.streak} days</div>
            <p className="text-xs text-muted-foreground">
              Keep up the momentum!
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Courses</CardTitle>
          <CardDescription>Track your progress across courses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {enrolledCourses.map((course) => (
              <div key={course.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{course.title}</h4>
                  <span className="text-sm text-muted-foreground">
                    Last accessed: {new Date(course.lastAccessed).toLocaleDateString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Time spent:</span>{" "}
                    {course.timeSpent}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Next up:</span>{" "}
                    {course.nextMilestone}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}