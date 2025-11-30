// app/dashboard/student/assignments/page.jsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, FileText } from "lucide-react";

export default function AssignmentsPage() {
  const assignments = [
    {
      id: 1,
      title: "Dental Anatomy Quiz",
      course: "Introduction to Dentistry",
      dueDate: "2024-03-15",
      status: "pending",
      progress: 0,
    },
    {
      id: 2,
      title: "Clinical Case Study",
      course: "Clinical Procedures",
      dueDate: "2024-03-20",
      status: "in-progress",
      progress: 65,
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
        <p className="text-muted-foreground">Manage your course assignments and submissions</p>
      </div>

      <div className="grid gap-4">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">{assignment.title}</h3>
                  <p className="text-sm text-muted-foreground">{assignment.course}</p>
                </div>
                <Badge 
                  variant={assignment.status === 'pending' ? 'destructive' : 'secondary'}
                  className="capitalize"
                >
                  {assignment.status}
                </Badge>
              </div>
              
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    Due {assignment.dueDate}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    2 hours estimated
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{assignment.progress}%</span>
                  </div>
                  <Progress value={assignment.progress} className="h-2" />
                </div>

                <div className="flex items-center gap-2">
                  <Button className="bg-[#3b82f6] hover:bg-[#2563eb]">
                    Continue
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <FileText className="h-4 w-4" />
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}