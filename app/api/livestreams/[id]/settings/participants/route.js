//app/api/livestreams/[id]/settings/participants/route.js

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
    const teacher = await Teacher.findById(decoded.userId).select('-password');

    if (!teacher) return null;

    return {
      id: teacher._id.toString(),
      role: 'teacher'
    };
  } catch (error) {
    return null;
  }
}

// Get participant settings
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
    .select('settings.participants')
    .lean();

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      settings: stream.settings?.participants || {
        waitingRoom: false,
        allowScreenShare: false,
        allowAudio: false,
        autoAdmit: true,
        maxParticipants: 100,
        allowHandRaise: true,
        allowReactions: true,
        muteOnEntry: true
      }
    });

  } catch (error) {
    console.error('Error fetching participant settings:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Update participant settings
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

    // Validate settings
    const validSettings = {
      waitingRoom: Boolean(updates.waitingRoom),
      allowScreenShare: Boolean(updates.allowScreenShare),
      allowAudio: Boolean(updates.allowAudio),
      autoAdmit: Boolean(updates.autoAdmit),
      maxParticipants: Math.max(1, Math.min(1000, parseInt(updates.maxParticipants) || 100)),
      allowHandRaise: Boolean(updates.allowHandRaise),
      allowReactions: Boolean(updates.allowReactions),
      muteOnEntry: Boolean(updates.muteOnEntry)
    };

    const stream = await LiveStream.findOneAndUpdate(
      {
        _id: id,
        teacherId: user.id
      },
      {
        $set: { 'settings.participants': validSettings }
      },
      { new: true }
    );

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found or unauthorized' },
        { status: 404 }
      );
    }

    // Broadcast settings update to connected clients
    const ws = await connectWebSocket();
    ws.broadcast(id, {
      type: 'participantSettingsUpdated',
      settings: validSettings
    });

    // Handle participant limit changes
    if (validSettings.maxParticipants) {
      const currentCount = await LiveStream.aggregate([
        { $match: { _id: stream._id } },
        { $project: { count: { $size: '$attendees' } } }
      ]);

      if (currentCount[0].count > validSettings.maxParticipants) {
        // Remove excess participants (LIFO)
        const excessCount = currentCount[0].count - validSettings.maxParticipants;
        const attendeesToRemove = stream.attendees.slice(-excessCount);

        await LiveStream.updateOne(
          { _id: stream._id },
          { 
            $pull: { attendees: { $in: attendeesToRemove } },
            $set: {
              [`participationRecords.${attendeesToRemove.join('|')}.leftAt`]: new Date(),
              [`participationRecords.${attendeesToRemove.join('|')}.leftReason`]: 'participant_limit'
            }
          }
        );

        // Notify removed participants
        attendeesToRemove.forEach(participantId => {
          ws.send(participantId, {
            type: 'removed',
            reason: 'Participant limit exceeded'
          });
        });
      }
    }

    return NextResponse.json({
      success: true,
      settings: validSettings
    });

  } catch (error) {
    console.error('Error updating participant settings:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Reset participant settings to default
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
    await connectDB();

    const defaultSettings = {
      waitingRoom: false,
      allowScreenShare: false,
      allowAudio: false,
      autoAdmit: true,
      maxParticipants: 100,
      allowHandRaise: true,
      allowReactions: true,
      muteOnEntry: true
    };

    const stream = await LiveStream.findOneAndUpdate(
      {
        _id: id,
        teacherId: user.id
      },
      {
        $set: { 'settings.participants': defaultSettings }
      },
      { new: true }
    );

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found or unauthorized' },
        { status: 404 }
      );
    }

    // Broadcast reset to connected clients
    const ws = await connectWebSocket();
    ws.broadcast(id, {
      type: 'participantSettingsUpdated',
      settings: defaultSettings
    });

    return NextResponse.json({
      success: true,
      settings: defaultSettings
    });

  } catch (error) {
    console.error('Error resetting participant settings:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}