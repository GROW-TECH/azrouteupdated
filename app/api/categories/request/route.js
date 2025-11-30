// app/api/categories/request/route.js
import { connectDB } from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';

async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    const student = await Student.findById(decoded.userId).select('-password');

    if (!student) {
      return null;
    }

    return {
      id: student._id.toString(),
      name: student.name,
      email: student.email,
      role: 'student'
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}


export async function POST(request) {
  try {
    const user = await verifyAuth();
        
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { subject, description, qualifications } = await request.json();

    if (!subject || !description || !qualifications) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { db } = await connectDB();

    await db.collection('categoryRequests').insertOne({
      subject,
      description,
      qualifications,
      teacherId: user.id,
      teacherName: user.name,
      teacherEmail: user.email,
      status: 'pending',
      createdAt: new Date(),
    });

    return NextResponse.json(
      { message: 'Category request submitted successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Category request error:', error);
    return NextResponse.json(
      { error: 'Failed to submit category request' },
      { status: 500 }
    );
  }
}
