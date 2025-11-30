// app/api/teacher/livestreams/recording/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { LiveStream } from '@/models/LiveStream';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Teacher from '@/models/Teacher';
import { storage } from '@/lib/firebase';
import { 
  ref, 
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';

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
      name: teacher.name,
      email: teacher.email,
      role: 'teacher'
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

// Start recording
export async function POST(req) {
  try {
    const user = await verifyAuth();
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const recordingBlob = formData.get('recording');
    const streamId = formData.get('streamId');
    const duration = formData.get('duration');

    if (!recordingBlob || !streamId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    // Generate unique filename
    const filename = `recordings/${streamId}/${Date.now()}.webm`;
    const storageRef = ref(storage, filename);

    try {
      // Convert Blob to ArrayBuffer
      const buffer = await recordingBlob.arrayBuffer();

      // Upload to Firebase Storage with metadata
      const uploadResult = await uploadBytes(storageRef, buffer, {
        contentType: 'video/webm',
        customMetadata: {
          teacherId: user.id,
          streamId,
          duration: duration?.toString() || '0',
          uploadedAt: new Date().toISOString()
        }
      });

      // Get the download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // Update livestream record
      await LiveStream.updateOne(
        { _id: new ObjectId(streamId) },
        {
          $push: {
            recordings: {
              _id: new ObjectId(),
              filename,
              url: downloadURL,
              duration: parseInt(duration) || 0,
              size: uploadResult.metadata.size,
              contentType: uploadResult.metadata.contentType,
              createdAt: new Date()
            }
          }
        }
      );

      return NextResponse.json({
        success: true,
        message: 'Recording saved successfully',
        data: {
          url: downloadURL,
          filename
        }
      });

    } catch (uploadError) {
      console.error('Firebase upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload recording' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error saving recording:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Optional: Get recording status or list
export async function GET(req) {
  try {
    const user = await verifyAuth();
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const streamId = searchParams.get('streamId');

    if (!streamId) {
      return NextResponse.json(
        { error: 'Stream ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get recordings for this stream
    const livestream = await LiveStream.findOne(
      { _id: new ObjectId(streamId) },
      { recordings: 1 }
    );

    if (!livestream) {
      return NextResponse.json(
        { error: 'Livestream not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      recordings: livestream.recordings || []
    });

  } catch (error) {
    console.error('Error fetching recordings:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
