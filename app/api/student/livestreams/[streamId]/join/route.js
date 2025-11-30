// app/api/student/livestreams/[streamId]/join/route.js
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
export async function POST(req, { params }) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { streamId } =await params;
    console.log('Attempting to join stream:', streamId);
    
    await connectDB();

    // Check if stream exists and is live
    const livestream = await LiveStream.findById(streamId);
    
    if (!livestream) {
      console.log('Livestream not found:', streamId);
      return NextResponse.json(
        { error: 'Livestream not found' },
        { status: 404 }
      );
    }

    if (livestream.status !== 'live') {
      console.log('Livestream not active:', streamId);
      return NextResponse.json(
        { error: 'Livestream is not active' },
        { status: 400 }
      );
    }

    // Add student to attendees if not already present
    const updateResult = await LiveStream.updateOne(
      { _id: new ObjectId(streamId) },
      {
        $addToSet: {
          attendees: new ObjectId(user.id)
        },
        $inc: {
          'statistics.totalViews': 1
        },
        $set: {
          [`participationRecords.${user.id}`]: {
            joinedAt: new Date(),
            lastActive: new Date(),
            interactions: 0
          }
        }
      }
    );

    console.log('Join update result:', updateResult);

    return NextResponse.json({
      success: true,
      message: 'Successfully joined livestream'
    });

  } catch (error) {
    console.error('Error joining livestream:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}

  
  