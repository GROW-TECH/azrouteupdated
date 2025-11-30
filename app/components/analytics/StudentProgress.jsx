// components/analytics/StudentProgress.jsx
import { Progress } from "../ui/progress";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";

export function StudentProgress() {
  const students = [
    { name: 'John Doe', progress: 75, lastActive: '2 days ago' },
    { name: 'Jane Smith', progress: 92, lastActive: '1 hour ago' },
    { name: 'Mike Johnson', progress: 45, lastActive: '5 days ago' },
    { name: 'Sarah Williams', progress: 88, lastActive: 'Today' },
    { name: 'Alex Brown', progress: 60, lastActive: '1 day ago' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Individual Student Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {students.map((student, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{student.name}</span>
                <span className="text-muted-foreground">Last active: {student.lastActive}</span>
              </div>
              <Progress value={student.progress} max={100} />
              <p className="text-sm text-muted-foreground">
                {student.progress}% complete
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}