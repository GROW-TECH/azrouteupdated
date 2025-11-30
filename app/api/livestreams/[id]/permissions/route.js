//app/api/livestreams/[id]/permissions/route.js

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { LiveStream } from '@/models/LiveStream';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Teacher from '@/models/Teacher';
import Student from '@/models/Student';

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
      role: decoded.role,
      name: user.name
    };
  } catch (error) {
    return null;
  }
}

// Get stream permissions
export async function GET(req, { params }) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } =await params;
    await connectDB();

    const stream = await LiveStream.findById(id)
      .select('teacherId moderators settings courseId isPublic')
      .lean();

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      );
    }

    const permissions = {
      isOwner: stream.teacherId.toString() === user.id,
      isModerator: stream.moderators?.includes(user.id),
      canModifySettings: false,
      canManageParticipants: false,
      canModerateChat: false,
      canScreenShare: false,
      canSpeak: false
    };

    // Set permissions based on role
    if (permissions.isOwner || permissions.isModerator) {
      permissions.canModifySettings = permissions.isOwner;
      permissions.canManageParticipants = true;
      permissions.canModerateChat = true;
      permissions.canScreenShare = true;
      permissions.canSpeak = true;
    } else {
      permissions.canScreenShare = !!stream.settings?.allowScreenShare;
      permissions.canSpeak = !!stream.settings?.allowParticipantAudio;
    }

    return NextResponse.json({ permissions });

  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Update permissions
export async function PATCH(req, { params }) {
  try {
    const user = await verifyAuth();
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } =await params;
    const updates = await req.json();
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

    // Update permitted settings
    const allowedUpdates = [
      'allowScreenShare',
      'allowParticipantAudio',
      'allowChat',
      'allowQuestions',
      'requireModeration',
      'allowReplays'
    ];

    const validUpdates = Object.fromEntries(
      Object.entries(updates).filter(([key]) => allowedUpdates.includes(key))
    );

    await LiveStream.updateOne(
      { _id: id },
      { $set: { 'settings': { ...stream.settings, ...validUpdates } } }
    );

    return NextResponse.json({
      success: true,
      message: 'Permissions updated successfully'
    });

  } catch (error) {
    console.error('Error updating permissions:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}