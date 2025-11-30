// app/api/teacher/assignments/[id]/submissions/route.js
import { NextResponse } from 'next/server';
import  Assignment  from '@/models/Assignment';
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
export async function GET(req, { params }) {
  try {
    const user = await verifyAuth();
          if (!user) {
            return NextResponse.json(
              { error: 'Unauthorized' },
              { status: 401 }
            );
          }

    await connectDB();
    const {id}=await params
    const assignment = await Assignment.findOne({
      _id: id,
      teacher: user.id
    })
    .populate('submissions.student', 'name email')
    .populate('course', 'title');

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(assignment);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}