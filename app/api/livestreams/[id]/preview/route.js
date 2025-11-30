//app/api/livestreams/[id]/preview/route.js

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { LiveStream } from '@/models/LiveStream';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');

  if (!token) return null;

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    const user = decoded.role === 'teacher' ? 
      await Teacher.findById(decoded.userId).select('-password') :
      await Student.findById(decoded.userId).select('-password');

    if (!user) return null;

    return {
      id: user._id.toString(),
      role: decoded.role
    };
  } catch (error) {
    return null;
  }
}

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } =await params;
    const user = await verifyAuth();

    // Get stream details with limited information for preview
    const stream = await LiveStream.findOne({ _id: id })
      .select(`
        title
        description
        teacherId
        teacherName
        courseId
        type
        status
        scheduledFor
        startedAt
        settings.platform
        settings.requireRegistration
        isPublic
        statistics.currentViewers
      `)
      .lean();

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    const canAccess = await checkStreamAccess(stream, user);
    if (!canAccess && !stream.isPublic) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get course information if applicable
    let courseName = null;
    if (stream.courseId) {
      const course = await Course.findById(stream.courseId)
        .select('title')
        .lean();
      courseName = course?.title;
    }

    // Get platform-specific preview data
    let platformData = {};
    if (stream.type !== 'native') {
      platformData = {
        platform: stream.settings.platform,
        requiresRegistration: stream.settings.requireRegistration
      };
    }

    return NextResponse.json({
      stream: {
        id: stream._id,
        title: stream.title,
        description: stream.description,
        teacherName: stream.teacherName,
        type: stream.type,
        status: stream.status,
        scheduledFor: stream.scheduledFor,
        startedAt: stream.startedAt,
        isPublic: stream.isPublic,
        courseName,
        statistics: {
          currentViewers: stream.statistics?.currentViewers || 0
        },
        ...platformData,
        canJoin: await checkJoinEligibility(stream, user)
      }
    });

  } catch (error) {
    console.error('Error fetching stream preview:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

async function checkStreamAccess(stream, user) {
  if (!user) return false;
  if (user.role === 'teacher' && stream.teacherId.toString() === user.id) return true;
  
  if (stream.courseId) {
    const enrollment = await Enrollment.findOne({
      courseId: stream.courseId,
      studentId: user.id,
      status: 'active'
    });
    return !!enrollment;
  }

  return true;
}

async function checkJoinEligibility(stream, user) {
  if (!user) return false;
  if (stream.status !== 'live') return false;
  
  // Teachers can always join their own streams
  if (user.role === 'teacher' && stream.teacherId.toString() === user.id) {
    return true;
  }

  // Check course enrollment if it's a course stream
  if (stream.courseId) {
    const enrollment = await Enrollment.findOne({
      courseId: stream.courseId,
      studentId: user.id,
      status: 'active'
    });
    return !!enrollment;
  }

  // Public streams can be joined by any authenticated user
  return stream.isPublic;
}