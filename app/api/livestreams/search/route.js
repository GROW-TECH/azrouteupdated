//app/api/livestreams/search/route.js

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

export async function GET(req) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // all, live, scheduled
    const course = searchParams.get('course');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;

    await connectDB();

    // Build search query
    const searchQuery = {
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { teacherName: { $regex: query, $options: 'i' } }
      ]
    };

    // Add type filter
    if (type === 'live') {
      searchQuery.status = 'live';
    } else if (type === 'scheduled') {
      searchQuery.status = 'scheduled';
    }

    // Add course filter
    if (course) {
      searchQuery.courseId = course;
    }

    // Add visibility filter for students
    if (user.role === 'student') {
      const enrolledCourses = await Enrollment.find({
        studentId: user.id
      }).select('courseId');

      searchQuery.$or.push(
        { isPublic: true },
        { courseId: { $in: enrolledCourses.map(e => e.courseId) } }
      );
    }

    // Execute search with pagination
    const [streams, total] = await Promise.all([
      LiveStream.find(searchQuery)
        .select('title description teacherName courseId status startedAt scheduledFor statistics type settings isPublic')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ 
          status: 1, // Live streams first
          scheduledFor: 1, 
          startedAt: -1 
        })
        .lean(),
      LiveStream.countDocuments(searchQuery)
    ]);

    // Enhance stream data
    const enhancedStreams = await Promise.all(
      streams.map(async (stream) => {
        let courseData = null;
        if (stream.courseId) {
          courseData = await Course.findById(stream.courseId)
            .select('title')
            .lean();
        }

        return {
          ...stream,
          id: stream._id.toString(),
          courseName: courseData?.title,
          canJoin: await checkStreamAccess(stream, user)
        };
      })
    );

    return NextResponse.json({
      streams: enhancedStreams,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    });

  } catch (error) {
    console.error('Error searching streams:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

async function checkStreamAccess(stream, user) {
  // Teachers can join any stream
  if (user.role === 'teacher') return true;

  // Public streams are accessible to all
  if (stream.isPublic) return true;

  // Check course enrollment for private streams
  if (stream.courseId) {
    const enrollment = await Enrollment.findOne({
      courseId: stream.courseId,
      studentId: user.id,
      status: 'active'
    });
    return !!enrollment;
  }

  return false;
}
