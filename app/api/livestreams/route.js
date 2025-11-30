// app/api/livestreams/route.js

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { LiveStream } from '@/models/LiveStream';
import  Course  from '@/models/Course'; // Import the Course model
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Teacher from '@/models/Teacher';
import Student from '@/models/Student';
import Enrollment from '@/models/CourseEnrollment';

// Auth helper function
async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    const user = decoded.role === 'teacher' ? 
      await Teacher.findById(decoded.userId).select('-password') :
      await Student.findById(decoded.userId).select('-password');

    if (!user) return null;

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: decoded.role
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

// GET - List all accessible livestreams
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
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'live';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;

    let query = { status };

    // Filter based on user role
    if (user.role === 'teacher') {
      query.teacherId = new mongoose.Types.ObjectId(user.id);
    } else {
      // For students, show public streams and streams from enrolled courses
      const enrollments = await Enrollment.find({ 
        studentId: user.id 
      }).select('courseId');
      
      const courseIds = enrollments.map(e => e.courseId);
      query.$or = [
        { isPublic: true },
        { courseId: { $in: courseIds } }
      ];
    }

    // Get total count for pagination
    const total = await LiveStream.countDocuments(query);

    // Get streams with pagination
    const streams = await LiveStream.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('teacherId', 'name')
      .populate('courseId', 'title')
      .lean();

    return NextResponse.json({
      streams,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching livestreams:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST - Create a new livestream
export async function POST(req) {
  try {
    const user = await verifyAuth();
    console.log("user",user)
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const body = await req.json();

    // Validate required fields
    const { title, description, type = 'native', settings = {}, courseId, scheduledFor } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Validate courseId if provided
    if (courseId) {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return NextResponse.json(
          { error: 'Invalid courseId' },
          { status: 400 }
        );
      }

      // Ensure the course exists
      const courseExists = await Course.findById(courseId);
      if (!courseExists) {
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        );
      }
    }

    // Handle external meeting creation
    if (type === 'external') {
      const { platform, meetingUrl } = body;

      if (!platform || !meetingUrl) {
        return NextResponse.json(
          { error: 'Platform and meeting URL are required for external meetings' },
          { status: 400 }
        );
      }

      // Validate meeting URL format based on platform
      const urlPatterns = {
        zoom: /^https:\/\/([\w-]+\.)?zoom.us\//,
        meet: /^https:\/\/meet.google.com\//,
        teams: /^https:\/\/teams.microsoft.com\//
      };

      if (!urlPatterns[platform]?.test(meetingUrl)) {
        return NextResponse.json(
          { error: 'Invalid meeting URL for the selected platform' },
          { status: 400 }
        );
      }
    }

    // Create livestream
    const livestream = new LiveStream({
      teacherId: user.id,
      // teacherName: user.name,
      title: title.trim(),
      description: description?.trim(),
      type,
      status: scheduledFor ? 'scheduled' : 'created',
      scheduledFor,
      courseId: courseId || null, // Set courseId to null if not provided
      isPublic: body.isPublic ?? false,
      settings: {
        ...settings,
        platform: type === 'external' ? body.platform : null,
        meetingUrl: type === 'external' ? body.meetingUrl : null
      }
    });

    await livestream.save();

    // Generate join link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const joinLink = `${baseUrl}/livestream/${livestream._id}`;

    return NextResponse.json({
      message: 'Livestream created successfully',
      livestream: {
        id: livestream._id,
        title: livestream.title,
        status: livestream.status,
        joinLink
      }
    });

  } catch (error) {
    console.error('Error creating livestream:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
