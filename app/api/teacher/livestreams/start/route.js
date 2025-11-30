// app/api/teacher/livestreams/start/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
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
  
export async function POST(req) {
  try {
    const user = await verifyAuth();
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const reqData = await req.json();
    console.log("Received request data:", reqData); // Debug log

    const { title, description, courseId } = reqData;
    
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create livestream document
    const livestream = {
      teacherId: new ObjectId(user.id),
      teacherName: user.name,
      courseId: courseId ? new ObjectId(courseId) : null,
      title,
      description,
      status: 'live',
      startedAt: new Date(),
      attendees: [],
      chat: [],
      settings: {
        isChatEnabled: true,
        isQuestionsEnabled: true,
        allowReplays: true
      },
      statistics: {
        peakViewers: 0,
        totalViews: 0,
        averageWatchTime: 0,
        interactions: 0
      }
    };

    const result = await LiveStream.create(livestream);
    console.log("Created livestream:", result); // Debug log

    return NextResponse.json({
      success: true,
      livestreamId: result._id.toString(),
      message: 'Livestream started successfully'
    });

  } catch (error) {
    console.error('Error starting livestream:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}




// Get active livestream status
export async function GET(req) {
  try {
    const user = await verifyAuth();
                      if (!user) {
                        return NextResponse.json(
                          { error: 'Unauthorized' },
                          { status: 401 }
                        );
                      }

    const { db } = await connectDB();

    // Find active livestream for the teacher
    const activeLivestream = await LiveStream.findOne({
      teacherId: new ObjectId(user.id),
      status: 'live'
    });

    if (!activeLivestream) {
      return NextResponse.json({
        isLive: false,
        message: 'No active livestream found'
      });
    }

    // Get real-time statistics
    const stats = {
      currentViewers: activeLivestream.attendees.length,
      totalViews: activeLivestream.statistics.totalViews,
      duration: Math.round((new Date() - new Date(activeLivestream.startedAt)) / 1000 / 60), // in minutes
      chatMessages: activeLivestream.chat.length
    };

    return NextResponse.json({
      isLive: true,
      livestreamId: activeLivestream._id,
      title: activeLivestream.title,
      startedAt: activeLivestream.startedAt,
      statistics: stats
    });

  } catch (error) {
    console.error('Error getting livestream status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Update livestream settings
export async function PATCH(req) {
  try {
    const user = await verifyAuth();
                      if (!user) {
                        return NextResponse.json(
                          { error: 'Unauthorized' },
                          { status: 401 }
                        );
                      }

    const { livestreamId, settings } = await req.json();

    if (!livestreamId || !settings) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { db } = await connectDB();

    // Update livestream settings
    const result = await LiveStream.updateOne(
      {
        _id: new ObjectId(livestreamId),
        teacherId: new ObjectId(user.id)
      },
      {
        $set: {
          settings: {
            ...settings,
            updatedAt: new Date()
          }
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Livestream not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Livestream settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating livestream settings:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
