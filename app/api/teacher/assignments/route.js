// app/api/teacher/assignments/route.js
import { NextResponse } from 'next/server';
import Assignment from '@/models/Assignment';
import { connectDB } from '@/lib/mongodb';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Teacher from '@/models/Teacher';

async function verifyAuth() {
  const cookieStore =await cookies();
  const token =  cookieStore.get('auth-token');

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
    
    const assignments = await Assignment.find({
      teacher: user.id
    })
    .populate('course', 'title')
    .sort({ dueDate: 1 });

    return NextResponse.json(assignments);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
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
    const assignment = new Assignment({
      ...data,
      teacher: user.id
    });

    await assignment.save();

    return NextResponse.json(assignment);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    );
  }
}
