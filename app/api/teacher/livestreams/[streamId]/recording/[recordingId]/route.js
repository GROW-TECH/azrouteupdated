// app/api/teacher/livestreams/[streamId]/recording/[recordingId]/route.js
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
  getDownloadURL, 
  deleteObject,
  uploadBytes,
  getMetadata
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

// Get recording playback URL
export async function GET(req, { params }) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { streamId, recordingId } = params;
    await connectDB();

    // Get recording details
    const livestream = await LiveStream.findOne(
      { 
        _id: new ObjectId(streamId),
        'recordings._id': new ObjectId(recordingId)
      },
      { 'recordings.$': 1 }
    );

    if (!livestream || !livestream.recordings[0]) {
      return NextResponse.json(
        { error: 'Recording not found' },
        { status: 404 }
      );
    }

    const recording = livestream.recordings[0];

    // Get download URL from Firebase Storage
    const storageRef = ref(storage, recording.filename);
    
    try {
      // Get metadata and URL
      const [metadata, url] = await Promise.all([
        getMetadata(storageRef),
        getDownloadURL(storageRef)
      ]);

      return NextResponse.json({
        success: true,
        url,
        recording: {
          id: recording._id,
          duration: recording.duration,
          createdAt: recording.createdAt,
          size: metadata.size,
          contentType: metadata.contentType
        }
      });
    } catch (error) {
      console.error('Firebase Storage error:', error);
      return NextResponse.json(
        { error: 'Recording file not found' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Error getting recording:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Upload recording
export async function POST(req, { params }) {
  try {
    const user = await verifyAuth();
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { streamId } =await params;
    const formData = await req.formData();
    const recordingBlob = formData.get('recording');
    const duration = formData.get('duration');

    if (!recordingBlob) {
      return NextResponse.json(
        { error: 'Recording file is required' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const filename = `recordings/${streamId}/${Date.now()}.webm`;
    const storageRef = ref(storage, filename);

    // Upload to Firebase Storage
    const buffer = await recordingBlob.arrayBuffer();
    await uploadBytes(storageRef, buffer, {
      contentType: 'video/webm',
      customMetadata: {
        duration: duration?.toString() || '0',
        uploadedBy: user.id
      }
    });

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);

    // Update livestream record
    await LiveStream.updateOne(
      { _id: new ObjectId(streamId) },
      {
        $push: {
          recordings: {
            _id: new ObjectId(),
            filename,
            duration: parseInt(duration) || 0,
            url: downloadURL,
            createdAt: new Date()
          }
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Recording uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading recording:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Delete recording
export async function DELETE(req, { params }) {
  try {
    const user = await verifyAuth();
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { streamId, recordingId } = params;
    await connectDB();

    // Get recording details
    const livestream = await LiveStream.findOne(
      {
        _id: new ObjectId(streamId),
        'recordings._id': new ObjectId(recordingId)
      },
      { 'recordings.$': 1 }
    );

    if (!livestream || !livestream.recordings[0]) {
      return NextResponse.json(
        { error: 'Recording not found' },
        { status: 404 }
      );
    }

    const filename = livestream.recordings[0].filename;

    // Delete from Firebase Storage
    const storageRef = ref(storage, filename);
    try {
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Firebase delete error:', error);
      // Continue with database cleanup even if file deletion fails
    }

    // Remove from database
    await LiveStream.updateOne(
      { _id: new ObjectId(streamId) },
      {
        $pull: {
          recordings: { _id: new ObjectId(recordingId) }
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Recording deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting recording:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}