// app/api/student/livestreams/[streamId]/participants/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { LiveStream } from '@/models/LiveStream';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Student from '@/models/Student';
import Enrollment from '@/models/CourseEnrollment';

async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');

  if (!token) return null;

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    const student = await Student.findById(decoded.userId).select('-password');

    if (!student) return null;

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

export async function GET(req, { params }) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { streamId } =await params;
    console.log('Fetching participants for stream:', streamId);
    
    await connectDB();

    const livestream = await LiveStream.findById(streamId)
      .select('attendees status courseId teacherId')
      .lean();

    if (!livestream) {
      console.log('Livestream not found:', streamId);
      return NextResponse.json(
        { error: 'Livestream not found' },
        { status: 404 }
      );
    }

    // Get participant details
    const participants = await Student.find({
      _id: { $in: livestream.attendees }
    })
    .select('name email')
    .lean();

    console.log(`Found ${participants.length} participants`);

    return NextResponse.json({
      participants: participants.map(p => ({
        ...p,
        id: p._id.toString()
      }))
    });

  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}



