// app/api/teacher/stream/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Teacher from '@/models/Teacher';
import mongoose from 'mongoose';

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
export async function POST(req) {
  try {
    const user = await verifyAuth();
                      if (!user) {
                        return NextResponse.json(
                          { error: 'Unauthorized' },
                          { status: 401 }
                        );
                      }
    const { title, description, status } = await req.json();
    
    const stream = await db.stream.create({
      data: {
        title,
        description,
        status,
        teacherId: user.id
      }
    });

    return NextResponse.json(stream);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
