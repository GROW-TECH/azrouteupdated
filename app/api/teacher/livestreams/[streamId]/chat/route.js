// app/api/teacher/livestreams/[streamId]/chat/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { use } from 'react';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Teacher from '@/models/Teacher';
import { LiveStream } from '@/models/LiveStream';

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

export async function POST(req, { params }) {
  try {
    const user = await verifyAuth();
                      if (!user) {
                        return NextResponse.json(
                          { error: 'Unauthorized' },
                          { status: 401 }
                        );
                      }

    const { streamId } =await params;
    const { message, type = 'chat' } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const { db } = await connectDB();

    // Find livestream and verify it's active
    const livestream = await LiveStream.findOne({
      _id: new ObjectId(streamId),
      status: 'live'
    });

    if (!livestream) {
      return NextResponse.json(
        { error: 'Livestream not found or has ended' },
        { status: 404 }
      );
    }

    // Check if chat is enabled
    if (!livestream.settings.isChatEnabled && type === 'chat') {
      return NextResponse.json(
        { error: 'Chat is disabled for this livestream' },
        { status: 403 }
      );
    }

    // Check if questions are enabled
    if (!livestream.settings.isQuestionsEnabled && type === 'question') {
      return NextResponse.json(
        { error: 'Questions are disabled for this livestream' },
        { status: 403 }
      );
    }

    // Add message to chat
    const chatMessage = {
      _id: new ObjectId(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      message,
      type,
      timestamp: new Date(),
      isHighlighted: false,
      isPinned: false,
      reactions: []
    };

    await LiveStream.updateOne(
      { _id: new ObjectId(streamId) },
      {
        $push: { chat: chatMessage },
        $inc: { 'statistics.interactions': 1 }
      }
    );

    return NextResponse.json({
      success: true,
      message: chatMessage
    });

  } catch (error) {
    console.error('Error sending chat message:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(req, { params }) {
  try {
    const user = await verifyAuth();
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { streamId } =await params;
    await connectDB();

    const livestream = await LiveStream.findById(streamId)
      .select('chat')
      .sort({ 'chat.timestamp': -1 })
      .limit(100)
      .lean();

    if (!livestream) {
      return NextResponse.json(
        { error: 'Livestream not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      messages: livestream.chat.reverse()
    });

  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Moderate chat message
export async function PATCH(req, { params }) {
  try {
    const user = await verifyAuth();
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { streamId } =await params;
    const { messageId, action, value } = await req.json();

    if (!messageId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    const updateField = {
      highlight: 'isHighlighted',
      pin: 'isPinned',
      delete: 'isDeleted'
    }[action];

    if (!updateField) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    await LiveStream.updateOne(
      {
        _id: new ObjectId(streamId),
        'chat._id': new ObjectId(messageId)
      },
      {
        $set: {
          [`chat.$.${updateField}`]: value ?? true
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Message updated successfully'
    });

  } catch (error) {
    console.error('Error moderating chat message:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
