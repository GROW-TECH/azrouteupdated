// app/api/notifications/route.js
import { NextResponse } from 'next/server';

// Mock notifications data
const mockNotifications = [
  {
    id: '1',
    title: 'New Course Available',
    message: 'A new course in Dental Anatomy has been added',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
  },
  {
    id: '2',
    title: 'Assignment Due Soon',
    message: 'Your Clinical Procedures assignment is due in 24 hours',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hour ago
  },
  {
    id: '3',
    title: 'Live Session Reminder',
    message: 'Your next live session starts in 1 hour',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString() // 2 hours ago
  }
];

export async function GET() {
  return NextResponse.json(mockNotifications);
}

// app/api/notifications/[id]/read/route.js
export async function PUT(request, { params }) {
  const { id } =await params;
  
  // In a real app, you would update the database
  // For now, we'll just return a success response
  return NextResponse.json({ success: true });
}
