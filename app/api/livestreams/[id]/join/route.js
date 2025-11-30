// app/api/livestreams/[id]/join/route.js

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { LiveStream } from '@/models/LiveStream';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { UAParser } from 'ua-parser-js';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';
import Enrollment from '@/models/CourseEnrollment';

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

    // Get livestream
    const livestream = await LiveStream.findById(id);
    if (!livestream) {
      return NextResponse.json(
        { error: 'Livestream not found' },
        { status: 404 }
      );
    }

    // Check if livestream is active
    if (!livestream.isActive()) {
      return NextResponse.json(
        { error: 'Livestream is not active' },
        { status: 400 }
      );
    }

    // Check participant limit
    if (!livestream.canJoin(user.id)) {
      return NextResponse.json(
        { error: 'Livestream is full' },
        { status: 403 }
      );
    }

    // Check course enrollment for students if it's a course livestream
    if (livestream.courseId && user.role === 'student') {
      const enrollment = await Enrollment.findOne({
        courseId: livestream.courseId,
        studentId: user.id,
        status: 'active'
      });

      if (!enrollment) {
        return NextResponse.json(
          { error: 'You must be enrolled in this course to join the livestream' },
          { status: 403 }
        );
      }
    }

    // Get device info
    const userAgent = req.headers.get('user-agent');
    const parser = new UAParser(userAgent);
    const deviceInfo = {
      browser: `${parser.getBrowser().name} ${parser.getBrowser().version}`,
      os: `${parser.getOS().name} ${parser.getOS().version}`,
      device: parser.getDevice().type || 'desktop'
    };

    // Handle external meeting platforms
    if (livestream.type !== 'native') {
      return NextResponse.json({
        type: 'external',
        platform: livestream.settings.platform,
        url: livestream.settings.meetingUrl,
        passcode: livestream.settings.passcode
      });
    }

    // Prepare participant data
    const participantData = {
      userId: user.id,
      userModel: user.role === 'teacher' ? 'Teacher' : 'Student',
      userName: user.name,
      joinedAt: new Date(),
      role: user.role === 'teacher' ? 'co-host' : 'participant',
      deviceInfo
    };

    // Add participant and update view count
    const updatedStream = await LiveStream.findByIdAndUpdate(
      id,
      {
        $push: { participants: participantData },
        $inc: { 'statistics.totalViews': 1 }
      },
      { new: true }
    );

    // Calculate and update peak concurrent users if needed
    const currentConcurrent = updatedStream.participants.filter(p => !p.leftAt).length;
    if (currentConcurrent > (updatedStream.statistics.peakConcurrent || 0)) {
      await LiveStream.findByIdAndUpdate(id, {
        $set: { 'statistics.peakConcurrent': currentConcurrent }
      });
    }

    // Generate WebRTC credentials if needed
    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' }
    ];

    if (process.env.TURN_SERVER) {
      iceServers.push({
        urls: process.env.TURN_SERVER,
        username: process.env.TURN_USERNAME,
        credential: process.env.TURN_CREDENTIAL
      });
    }

    // Return necessary information for joining
    return NextResponse.json({
      success: true,
      type: 'native',
      streamData: {
        id: livestream._id,
        title: livestream.title,
        teacherId: livestream.teacherId,
        settings: {
          isChatEnabled: livestream.settings.isChatEnabled,
          isQuestionsEnabled: livestream.settings.isQuestionsEnabled
        }
      },
      iceServers,
      participantId: user.id,
      role: user.role,
      activeParticipants: currentConcurrent
    });

  } catch (error) {
    console.error('Error joining livestream:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}