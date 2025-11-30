// app/api/student/livestreams/[streamId]/chat/route.js

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { LiveStream } from '@/models/LiveStream';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Student from '@/models/Student';

async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    const student = await Student.findById(decoded.userId).select('-password');

    if (!student) {
      return null;
    }

    return {
      id: student._id.toString(),
      name: student.name,
      email: student.email,
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

    const { streamId } =await params;
    const { searchParams } = new URL(req.url);
    const lastMessageId = searchParams.get('lastMessageId');
    const limit = parseInt(searchParams.get('limit')) || 50;

    await connectDB();

    let query = { _id: new ObjectId(streamId) };

    // Get recent messages
    const pipeline = [
      { $match: query },
      { $unwind: '$chat' },
      { $sort: { 'chat.timestamp': -1 } },
      { $limit: limit }
    ];

    if (lastMessageId) {
      pipeline.push({
        $match: {
          'chat._id': { $gt: new ObjectId(lastMessageId) }
        }
      });
    }

    const messages = await LiveStream
      .aggregate(pipeline)

    return NextResponse.json({
      success: true,
      messages: messages.map(m => m.chat).reverse()
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Send chat message
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

    await connectDB();

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

    // Add message
    const chatMessage = {
      _id: new ObjectId(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      message,
      type,
      timestamp: new Date()
    };

    await LiveStream.updateOne(
      { _id: new ObjectId(streamId) },
      {
        $push: { chat: chatMessage },
        $inc: { 'statistics.totalInteractions': 1 }
      }
    );

    return NextResponse.json({
      success: true,
      message: chatMessage
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

    
   