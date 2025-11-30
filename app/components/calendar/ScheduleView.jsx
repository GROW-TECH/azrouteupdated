// components/calendar/ScheduleView.jsx
"use client"
import { useState } from 'react';
import { Calendar } from './Calendar';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export function ScheduleView({ userType }) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Sample events - in a real app, these would come from your backend
  const events = [
    {
      id: 1,
      title: 'Web Development Basics',
      type: 'class',
      date: '2024-10-30T10:00:00',
      description: 'Introduction to HTML and CSS',
      teacher: 'Sarah Johnson',
      duration: '1 hour'
    },
    {
      id: 2,
      title: 'JavaScript Fundamentals',
      type: 'class',
      date: '2024-10-30T14:00:00',
      description: 'Basic JavaScript concepts and syntax',
      teacher: 'Mike Peterson',
      duration: '1.5 hours'
    },
    // Add more sample events as needed
  ];

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Schedule</h2>
        {userType === 'teacher' && (
          <Dialog>
            <DialogTrigger asChild>
              <Button>Schedule New Class</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule a New Class</DialogTitle>
                <DialogDescription>
                  Fill in the details for your new class session.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Class Title</Label>
                    <Input id="title" placeholder="Enter class title" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date & Time</Label>
                    <Input id="date" type="datetime-local" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" placeholder="Enter class description" />
                </div>
                <Button className="w-full">Create Class</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Calendar 
            events={events}
            onEventClick={handleEventClick}
            userType={userType}
          />
        </CardContent>
      </Card>

      {selectedEvent && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedEvent.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Date:</strong> {format(new Date(selectedEvent.date), 'PPP')}</p>
              <p><strong>Time:</strong> {format(new Date(selectedEvent.date), 'p')}</p>
              <p><strong>Duration:</strong> {selectedEvent.duration}</p>
              <p><strong>Teacher:</strong> {selectedEvent.teacher}</p>
              <p><strong>Description:</strong> {selectedEvent.description}</p>
              {userType === 'student' && (
                <Button className="mt-4">Join Class</Button>
              )}
              {userType === 'teacher' && (
                <div className="flex gap-2 mt-4">
                  <Button>Start Class</Button>
                  <Button variant="outline">Edit</Button>
                  <Button variant="destructive">Cancel Class</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}