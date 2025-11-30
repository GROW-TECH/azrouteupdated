import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Discussion from '@/models/Discussion';
import Teacher from '@/models/Teacher';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');
  
  if (!token) {
    return null;
  }
  
  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    const teacher = await Teacher.findById(decoded.userId).select('-password');
    
    if (!teacher) {
      return null;
    }
    
    return {
      id: teacher._id.toString(),
      name: teacher.name,
      email: teacher.email,
      role: 'teacher'
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

export async function POST(req) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const data = await req.json();

    // Create a new discussion document without studentId since it's a teacher posting
    const discussion = new Discussion({
      ...data,
      author: new mongoose.Types.ObjectId(user.id), // Store teacher's ID as author
      type: data.type || 'discussion',
      status: 'open',
      lastActivity: new Date(),
      // Remove studentId field since this is a teacher-created discussion
      studentId: undefined
    });
    
    await discussion.save();
    return NextResponse.json(discussion);
  } catch (error) {
    console.error('Create discussion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create discussion' },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    // Find discussions where the teacher is the author
    const discussions = await Discussion.find({ author: user.id })
      .sort({ lastActivity: -1, isPinned: -1 })
      .populate('courseId', 'title')
      .populate('replies.userId', 'name');
    
    return NextResponse.json(discussions);
  } catch (error) {
    console.error('Fetch discussions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discussions' },
      { status: 500 }
    );
  }
}
