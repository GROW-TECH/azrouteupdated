//app/api/livestreams/[id]/recordings/[recordingId]/access/route.js

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { LiveStream } from '@/models/LiveStream';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { storage } from '@/lib/firebase';
import { ref, getDownloadURL } from 'firebase/storage';

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

    await connectDB();
    const { id, recordingId } = params;

    // Verify stream and recording access
    const stream = await LiveStream.findOne({
      _id: id,
      'recordings._id': recordingId,
      $or: [
        { isPublic: true },
        { courseId: { $in: await getStudentCourseIds(user.id) } }
      ]
    }).select('settings recordings.$');

    if (!stream || !stream.settings.allowReplays) {
      return NextResponse.json(
        { error: 'Recording not found or access denied' },
        { status: 404 }
      );
    }

    const recording = stream.recordings[0];

    // Generate time-limited access URL
    const storageRef = ref(storage, recording.filename);
    const downloadUrl = await getDownloadURL(storageRef);

    // Track recording access
    await LiveStream.updateOne(
      { _id: id, 'recordings._id': recordingId },
      {
        $push: {
          'recordings.$.accessLog': {
            userId: user.id,
            timestamp: new Date()
          }
        },
        $inc: {
          'recordings.$.viewCount': 1
        }
      }
    );

    return NextResponse.json({
      url: downloadUrl,
      metadata: {
        duration: recording.duration,
        size: recording.size,
        format: recording.format
      }
    });

  } catch (error) {
    console.error('Error accessing recording:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

async function getStudentCourseIds(studentId) {
  const enrollments = await Enrollment.find({
    studentId,
    status: 'active'
  }).select('courseId');
  
  return enrollments.map(e => e.courseId);
}