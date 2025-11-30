// app/api/livestreams/[id]/route.js

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { LiveStream } from '@/models/LiveStream';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Teacher from '@/models/Teacher';
import Student from '@/models/Student';
import Enrollment from '@/models/CourseEnrollment';

// Auth helper function (reused from route.js)
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

// GET - Fetch a specific livestream
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
    const { id } =await params;
    console.log("id",id)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid livestream ID' },
        { status: 400 }
      );
    }

    const livestream = await LiveStream.findById(id)
      .populate('teacherId', 'name email')
      .populate('courseId', 'title')
      .lean();

    if (!livestream) {
      return NextResponse.json(
        { error: 'Livestream not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    if (user.role === 'student') {
      if (!livestream.isPublic) {
        const enrollment = await Enrollment.findOne({
          studentId: user.id,
          courseId: livestream.courseId
        });

        if (!enrollment) {
          return NextResponse.json(
            { error: 'Access denied' },
            { status: 403 }
          );
        }
      }
    } else if (user.role === 'teacher' && livestream.teacherId._id.toString() !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(livestream);

  } catch (error) {
    console.error('Error fetching livestream:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PATCH - Update a livestream
export async function PATCH(req, { params }) {
  try {
    const user = await verifyAuth();
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const { id } =await params;
    const body = await req.json();

    const livestream = await LiveStream.findOne({
      _id: id,
      teacherId: user.id
    });

    if (!livestream) {
      return NextResponse.json(
        { error: 'Livestream not found' },
        { status: 404 }
      );
    }

    // Validate and update fields
    const allowedUpdates = [
      'title',
      'description',
      'status',
      'scheduledFor',
      'isPublic',
      'settings'
    ];

    for (const [key, value] of Object.entries(body)) {
      if (allowedUpdates.includes(key)) {
        if (key === 'title' && (!value?.trim())) {
          return NextResponse.json(
            { error: 'Title cannot be empty' },
            { status: 400 }
          );
        }
        livestream[key] = value;
      }
    }

    await livestream.save();

    return NextResponse.json({
      message: 'Livestream updated successfully',
      livestream
    });

  } catch (error) {
    console.error('Error updating livestream:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a livestream
export async function DELETE(req, { params }) {
  try {
    const user = await verifyAuth();
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const { id } =await params;

    const livestream = await LiveStream.findOne({
      _id: id,
      teacherId: user.id
    });

    if (!livestream) {
      return NextResponse.json(
        { error: 'Livestream not found' },
        { status: 404 }
      );
    }

    // Don't allow deletion of active streams
    if (livestream.status === 'live') {
      return NextResponse.json(
        { error: 'Cannot delete an active livestream' },
        { status: 400 }
      );
    }

    await livestream.deleteOne();

    return NextResponse.json({
      message: 'Livestream deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting livestream:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}