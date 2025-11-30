// components/performance/AssessmentHistory.jsx
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

export function AssessmentHistory() {
  const assessments = [
    {
      title: "Advanced JavaScript - Week 8",
      type: "Quiz",
      score: 95,
      date: "2024-10-28",
      status: "Completed",
      feedback: "Excellent understanding of advanced concepts",
    },
    {
      title: "React Components Project",
      type: "Project",
      score: 88,
      date: "2024-10-25",
      status: "Completed",
      feedback: "Good implementation, needs better documentation",
    },
    {
      title: "API Integration Assignment",
      type: "Assignment",
      score: 92,
      date: "2024-10-20",
      status: "Completed",
      feedback: "Great work on error handling",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {assessments.map((assessment, index) => (
            <div
              key={index}
              className="flex items-start justify-between pb-4 border-b last:border-0"
            >
              <div className="space-y-1">
                <p className="font-medium">{assessment.title}</p>
                <div className="flex items-center space-x-2">
                  <Badge variant={assessment.type === "Quiz" ? "default" : "secondary"}>
                    {assessment.type}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(assessment.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{assessment.feedback}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-primary">{assessment.score}%</span>
                <p className="text-sm text-muted-foreground">{assessment.status}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}