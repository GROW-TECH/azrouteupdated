// components/assignments/AssignmentList.jsx
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";

export function AssignmentList({ type, userType }) {
  // Sample data - in a real app, this would come from your backend
  const assignments = [
    {
      id: 1,
      title: "React Component Architecture",
      course: "Advanced Web Development",
      dueDate: "2024-11-05",
      status: "pending",
      submissionRate: 75,
      averageGrade: 82,
      description: "Create a scalable component architecture for a React application.",
      totalSubmissions: 45,
      yourGrade: userType === 'student' ? 88 : null
    },
    {
      id: 2,
      title: "API Integration Project",
      course: "Backend Development",
      dueDate: "2024-11-10",
      status: "submitted",
      submissionRate: 60,
      averageGrade: 78,
      description: "Implement RESTful API integration with error handling.",
      totalSubmissions: 36,
      yourGrade: userType === 'student' ? 92 : null
    }
  ];

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => (
        <Card key={assignment.id}>
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-bold">{assignment.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{assignment.course}</p>
            </div>
            <Badge
              variant={
                assignment.status === 'pending'
                  ? 'default'
                  : assignment.status === 'submitted'
                  ? 'secondary'
                  : 'outline'
              }
            >
              {assignment.status}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm">{assignment.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span>Due Date:</span>
                  <span>{new Date(assignment.dueDate).toLocaleDateString()}</span>
                </div>
                {userType === 'teacher' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Submission Rate</span>
                      <span>{assignment.submissionRate}%</span>
                    </div>
                    <Progress value={assignment.submissionRate} max={100} />
                  </div>
                )}
                {userType === 'student' && assignment.yourGrade && (
                  <div className="flex items-center justify-between text-sm">
                    <span>Your Grade:</span>
                    <span className="font-bold">{assignment.yourGrade}%</span>
                  </div>
                )}
              </div>
              <div className="flex justify-end items-center space-x-2">
                {userType === 'teacher' ? (
                  <>
                    <Button variant="outline">View Submissions</Button>
                    <Button>Grade Assignment</Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline">View Details</Button>
                    {assignment.status === 'pending' && (
                      <Button>Submit Assignment</Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}