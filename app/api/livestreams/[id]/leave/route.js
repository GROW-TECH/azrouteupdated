// app/api/livestreams/[id]/leave/route.js

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { LiveStream } from '@/models/LiveStream';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';

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
      name: user.name,
      email: user.email,
      role: decoded.role
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

    await connectDB();
    const { id } =await params;
    const now = new Date();

    // Update participant status
    const updatedStream = await LiveStream.findOneAndUpdate(
      {
        _id: id,
        'participants.userId': user.id,
        'participants.leftAt': null // Only update if they haven't already left
      },
      {
        $set: {
          'participants.$.leftAt': now
        }
      },
      { new: true }
    );

    if (!updatedStream) {
      return NextResponse.json(
        { error: 'Participant not found or already left' },
        { status: 404 }
      );
    }

    // If teacher is leaving and they're the last teacher, end the stream
    if (user.role === 'teacher') {
      const activeTeachers = updatedStream.participants.filter(p => 
        p.userModel === 'Teacher' && !p.leftAt
      );

      if (activeTeachers.length === 0) {
        updatedStream.status = 'ended';
        updatedStream.endedAt = now;
        updatedStream.duration = Math.round(
          (now - updatedStream.startedAt) / 1000 / 60
        );
        await updatedStream.save();

        // Automatically mark all remaining participants as left
        await LiveStream.updateOne(
          { _id: id },
          {
            $set: {
              'participants.$[elem].leftAt': now
            }
          },
          {
            arrayFilters: [{ 'elem.leftAt': null }],
            multi: true
          }
        );
      }
    }

    // Calculate watch time for analytics
    const participant = updatedStream.participants.find(
      p => p.userId.toString() === user.id
    );
    
    const watchTimeMinutes = Math.round(
      (now - participant.joinedAt) / 1000 / 60
    );

    // Update statistics
    await LiveStream.updateOne(
      { _id: id },
      {
        $inc: {
          'statistics.totalWatchTime': watchTimeMinutes
        },
        $set: {
          'statistics.averageWatchTime': {
            $divide: [
              { $add: ['$statistics.totalWatchTime', watchTimeMinutes] },
              { $size: '$participants' }
            ]
          }
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Successfully left livestream',
      isStreamEnded: updatedStream.status === 'ended',
      watchTime: watchTimeMinutes
    });

  } catch (error) {
    console.error('Error leaving livestream:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}