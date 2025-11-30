// app/api/student/livestreams/[streamId]/signal/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import Student from '@/models/Student';
import  redis  from '@/lib/redis'; // Redis client for signaling

const REDIS_CHANNEL_PREFIX = 'livestream:';
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: process.env.TURN_SERVER,
    username: process.env.TURN_USERNAME,
    credential: process.env.TURN_CREDENTIAL
  }
];

async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');

  if (!token) return null;

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    const student = await Student.findById(decoded.userId).select('-password');

    if (!student) return null;

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
    const { type, candidate, answer } = await req.json();
    const redisChannel = `${REDIS_CHANNEL_PREFIX}${streamId}`;

    await connectDB();

    // Handle different signal types
    switch (type) {
      case 'join': {
        // Get the teacher's offer from Redis
        const offer = await redis.get(`${redisChannel}:offer`);
        if (!offer) {
          return NextResponse.json(
            { error: 'Stream not ready' },
            { status: 404 }
          );
        }

        // Store client info
        await redis.hSet(`${redisChannel}:clients`, user.id, JSON.stringify({
          id: user.id,
          name: user.name,
          joinedAt: Date.now()
        }));

        // Return offer to client
        return NextResponse.json({
          offer: JSON.parse(offer),
          iceServers: ICE_SERVERS
        });
      }

      case 'answer': {
        // Store client's answer
        await redis.set(
          `${redisChannel}:answer:${user.id}`,
          JSON.stringify(answer),
          'EX',
          3600 // 1 hour expiry
        );

        // Notify teacher about the answer
        await redis.publish(`${redisChannel}:signaling`, JSON.stringify({
          type: 'answer',
          clientId: user.id,
          answer
        }));

        return NextResponse.json({ success: true });
      }

      case 'candidate': {
        // Forward ICE candidate to teacher
        await redis.publish(`${redisChannel}:signaling`, JSON.stringify({
          type: 'candidate',
          clientId: user.id,
          candidate
        }));

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid signal type' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Signaling error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
