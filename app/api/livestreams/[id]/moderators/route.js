//app/api/livestreams/[id]/moderators/route.js

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { LiveStream } from '@/models/LiveStream';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Teacher from '@/models/Teacher';

async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');

  if (!token) return null;

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    const teacher = await Teacher.findById(decoded.userId).select('-password');

    if (!teacher) return null;

    return {
      id: teacher._id.toString(),
      role: 'teacher',
      name: teacher.name
    };
  } catch (error) {
    return null;
  }
}

// Get stream moderators
export async function GET(req, { params }) {
  try {
    const user = await verifyAuth();
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } =await params;
    await connectDB();

    const stream = await LiveStream.findOne({
      _id: id,
      teacherId: user.id
    })
    .populate('moderators', 'name email')
    .select('moderators')
    .lean();

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      moderators: stream.moderators || []
    });

  } catch (error) {
    console.error('Error fetching moderators:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Add moderator
export async function POST(req, { params }) {
  try {
    const user = await verifyAuth();
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } =await params;
    const { teacherId } = await req.json();
    await connectDB();

    // Verify stream ownership
    const stream = await LiveStream.findOne({
      _id: id,
      teacherId: user.id
    });

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found or unauthorized' },
        { status: 404 }
      );
    }

    // Verify teacher exists
    const teacher = await Teacher.findById(teacherId).select('name email');
    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Add moderator if not already added
    const updated = await LiveStream.findByIdAndUpdate(
      id,
      {
        $addToSet: { moderators: teacherId }
      },
      { new: true }
    )
    .populate('moderators', 'name email');

    return NextResponse.json({
      success: true,
      moderators: updated.moderators
    });

  } catch (error) {
    console.error('Error adding moderator:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Remove moderator
export async function DELETE(req, { params }) {
  try {
    const user = await verifyAuth();
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } =await params;
    const { teacherId } = await req.json();
    await connectDB();

    // Verify stream ownership
    const stream = await LiveStream.findOne({
      _id: id,
      teacherId: user.id
    });

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found or unauthorized' },
        { status: 404 }
      );
    }

    // Remove moderator
    const updated = await LiveStream.findByIdAndUpdate(
      id,
      {
        $pull: { moderators: teacherId }
      },
      { new: true }
    )
    .populate('moderators', 'name email');

    return NextResponse.json({
      success: true,
      moderators: updated.moderators
    });

  } catch (error) {
    console.error('Error removing moderator:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}