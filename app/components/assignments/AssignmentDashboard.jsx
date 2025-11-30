// components/assignments/AssignmentDashboard.jsx
"use client"
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { AssignmentList } from "./AssignmentList";
import { CreateAssignment } from "./CreateAssignment";
import { AssignmentStats } from "./AssignmentStats";
import { Calendar, ListTodo, FileText, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

export function AssignmentDashboard({ userType }) {
  const [view, setView] = useState('upcoming');
  
  const stats = {
    pending: userType === 'teacher' ? 15 : 3,
    submitted: userType === 'teacher' ? 45 : 5,
    graded: userType === 'teacher' ? 30 : 4,
    totalStudents: 60
  };

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              {userType === 'teacher' ? 'Needs grading' : 'Due soon'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.submitted}</div>
            <p className="text-xs text-muted-foreground">
              {userType === 'teacher' ? 'Total submissions' : 'Completed assignments'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Graded</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.graded}</div>
            <p className="text-xs text-muted-foreground">
              {userType === 'teacher' ? 'Feedback provided' : 'Received feedback'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {userType === 'teacher' ? 'Total Students' : 'Overall Grade'}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userType === 'teacher' ? stats.totalStudents : '85%'}
            </div>
            <p className="text-xs text-muted-foreground">
              {userType === 'teacher' ? 'Across all courses' : 'Average score'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex justify-between items-center">
        <Tabs value={view} onValueChange={setView} className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="submitted">Submitted</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>
            {userType === 'teacher' && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Create Assignment</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Assignment</DialogTitle>
                    <DialogDescription>
                      Create a new assignment for your students.
                    </DialogDescription>
                  </DialogHeader>
                  <CreateAssignment />
                </DialogContent>
              </Dialog>
            )}
          </div>

          <TabsContent value="upcoming">
            <AssignmentList 
              type="upcoming" 
              userType={userType}
            />
          </TabsContent>
          <TabsContent value="submitted">
            <AssignmentList 
              type="submitted" 
              userType={userType}
            />
          </TabsContent>
          <TabsContent value="past">
            <AssignmentList 
              type="past" 
              userType={userType}
            />
          </TabsContent>
        </Tabs>
      </div>

      {userType === 'teacher' && <AssignmentStats />}
    </div>
  );
}