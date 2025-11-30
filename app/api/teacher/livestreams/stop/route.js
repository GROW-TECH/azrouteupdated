// app/api/teacher/livestreams/stop/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { LiveStream } from '@/models/LiveStream';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Teacher from '@/models/Teacher';
import Course from '@/models/Course';


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
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Find active livestream
    const activeLivestream = await LiveStream.findOne({
      teacherId: new ObjectId(user.id),
      status: 'live'
    });

    if (!activeLivestream) {
      return NextResponse.json(
        { error: 'No active livestream found' },
        { status: 404 }
      );
    }

    const endedAt = new Date();
    const duration = Math.round(
      (endedAt - new Date(activeLivestream.startedAt)) / 1000 / 60
    );

    // Update livestream status
    await LiveStream.updateOne(
      { _id: activeLivestream._id },
      {
        $set: {
          status: 'ended',
          endedAt,
          duration,
          'statistics.finalViewerCount': activeLivestream.attendees.length,
          'statistics.totalDuration': duration,
          'statistics.finalChatCount': activeLivestream.chat?.length || 0
        }
      }
    );

    // Update course if associated
    if (activeLivestream.courseId) {
      await Course.updateOne(
        { _id: activeLivestream.courseId },
        {
          $set: {
            [`livestreams.${activeLivestream._id}.endedAt`]: endedAt,
            [`livestreams.${activeLivestream._id}.duration`]: duration
          }
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Livestream ended successfully',
      statistics: {
        duration,
        totalViewers: activeLivestream.statistics.totalViews,
        peakViewers: activeLivestream.statistics.peakViewers,
        chatMessages: activeLivestream.chat?.length || 0
      }
    });

  } catch (error) {
    console.error('Error ending livestream:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
