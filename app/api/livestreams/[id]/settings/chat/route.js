//app/api/livestreams/[id]/settings/chat/route.js

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

// Get chat settings
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
    .select('settings.chat')
    .lean();

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      settings: stream.settings?.chat || {
        enabled: true,
        slowMode: false,
        slowModeInterval: 5,
        participantLimit: null,
        filterProfanity: true,
        allowLinks: false,
        requireModeration: false
      }
    });

  } catch (error) {
    console.error('Error fetching chat settings:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Update chat settings
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
      enabled: Boolean(updates.enabled),
      slowMode: Boolean(updates.slowMode),
      slowModeInterval: Math.max(1, Math.min(300, parseInt(updates.slowModeInterval) || 5)),
      participantLimit: updates.participantLimit ? Math.max(1, parseInt(updates.participantLimit)) : null,
      filterProfanity: Boolean(updates.filterProfanity),
      allowLinks: Boolean(updates.allowLinks),
      requireModeration: Boolean(updates.requireModeration)
    };

    const stream = await LiveStream.findOneAndUpdate(
      {
        _id: id,
        teacherId: user.id
      },
      {
        $set: { 'settings.chat': validSettings }
      },
      { new: true }
    );

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found or unauthorized' },
        { status: 404 }
      );
    }

    // Broadcast settings update to connected clients via WebSocket
    const ws = await connectWebSocket();
    ws.broadcast(id, {
      type: 'chatSettingsUpdated',
      settings: validSettings
    });

    return NextResponse.json({
      success: true,
      settings: validSettings
    });

  } catch (error) {
    console.error('Error updating chat settings:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Reset chat settings to default
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
      enabled: true,
      slowMode: false,
      slowModeInterval: 5,
      participantLimit: null,
      filterProfanity: true,
      allowLinks: false,
      requireModeration: false
    };

    const stream = await LiveStream.findOneAndUpdate(
      {
        _id: id,
        teacherId: user.id
      },
      {
        $set: { 'settings.chat': defaultSettings }
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
      type: 'chatSettingsUpdated',
      settings: defaultSettings
    });

    return NextResponse.json({
      success: true,
      settings: defaultSettings
    });

  } catch (error) {
    console.error('Error resetting chat settings:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}