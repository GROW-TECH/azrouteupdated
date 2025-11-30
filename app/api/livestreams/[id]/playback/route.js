//app/api/livestreams/[id]/playback/route.js

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { LiveStream } from '@/models/LiveStream';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { storage } from '@/lib/firebase';
import { 
  ref, 
  getDownloadURL, 
  uploadBytes,
  getMetadata 
} from 'firebase/storage';

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
      role: decoded.role
    };
  } catch (error) {
    return null;
  }
}

// Get playback info and URLs
export async function GET(req, { params }) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } =await params;
    await connectDB();

    // Get stream with playback info
    const stream = await LiveStream.findOne({
      _id: id,
      $or: [
        { teacherId: user.id },
        { isPublic: true },
        { courseId: { $in: await getStudentCourses(user.id) } }
      ]
    })
    .select('recordings settings.allowReplays')
    .lean();

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found or unauthorized' },
        { status: 404 }
      );
    }

    if (!stream.settings?.allowReplays && user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Replays not allowed for this stream' },
        { status: 403 }
      );
    }

    // Get signed URLs for recordings
    const recordingsWithUrls = await Promise.all(
      stream.recordings.map(async (recording) => {
        const storageRef = ref(storage, recording.filename);
        try {
          const [url, metadata] = await Promise.all([
            getDownloadURL(storageRef),
            getMetadata(storageRef)
          ]);

          return {
            ...recording,
            url,
            contentType: metadata.contentType,
            size: metadata.size
          };
        } catch (error) {
          console.error(`Error getting recording URL: ${error}`);
          return null;
        }
      })
    );

    const validRecordings = recordingsWithUrls.filter(r => r !== null);

    return NextResponse.json({
      recordings: validRecordings,
      playbackSettings: {
        allowReplays: stream.settings?.allowReplays ?? true,
        hasRecordings: validRecordings.length > 0
      }
    });

  } catch (error) {
    console.error('Error getting playback info:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Update playback settings
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

    // Validate and update playback settings
    const validSettings = {
      allowReplays: Boolean(updates.allowReplays),
      requireRegistration: Boolean(updates.requireRegistration),
      downloadEnabled: Boolean(updates.downloadEnabled),
      autoPlay: Boolean(updates.autoPlay),
      playbackSpeed: updates.playbackSpeed ? 
        Math.max(0.5, Math.min(2, parseFloat(updates.playbackSpeed))) : 1,
      quality: ['auto', 'high', 'medium', 'low'].includes(updates.quality) ? 
        updates.quality : 'auto'
    };

    const stream = await LiveStream.findOneAndUpdate(
      {
        _id: id,
        teacherId: user.id
      },
      {
        $set: { 'settings.playback': validSettings }
      },
      { new: true }
    );

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: validSettings
    });

  } catch (error) {
    console.error('Error updating playback settings:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Start processing recording
export async function POST(req, { params }) {
  try {
    const user = await verifyAuth();
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } =await params;
    const formData = await req.formData();
    const recordingFile = formData.get('recording');
    const quality = formData.get('quality') || 'high';

    if (!recordingFile) {
      return NextResponse.json(
        { error: 'Recording file is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Generate unique filename
    const filename = `recordings/${id}/${Date.now()}.webm`;
    const storageRef = ref(storage, filename);

    // Upload original recording
    const buffer = await recordingFile.arrayBuffer();
    await uploadBytes(storageRef, buffer, {
      contentType: 'video/webm',
      metadata: {
        quality,
        teacherId: user.id,
        processedAt: new Date().toISOString()
      }
    });

    // Get download URL
    const url = await getDownloadURL(storageRef);

    // Update stream with recording info
    await LiveStream.updateOne(
      { _id: id },
      {
        $push: {
          recordings: {
            filename,
            url,
            quality,
            status: 'ready',
            processedAt: new Date()
          }
        }
      }
    );

    return NextResponse.json({
      success: true,
      recording: {
        filename,
        url,
        quality
      }
    });

  } catch (error) {
    console.error('Error processing recording:', error);
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

    const { id } =await params;
    const { filename } = await req.json();

    await connectDB();

    // Find stream and recording
    const stream = await LiveStream.findOne({
      _id: id,
      teacherId: user.id,
      'recordings.filename': filename
    });

    if (!stream) {
      return NextResponse.json(
        { error: 'Recording not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete from storage
    const storageRef = ref(storage, filename);
    try {
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting from storage:', error);
    }

    // Remove from database
    await LiveStream.updateOne(
      { _id: id },
      { $pull: { recordings: { filename } } }
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

async function getStudentCourses(studentId) {
  const enrollments = await Enrollment.find({
    studentId,
    status: 'active'
  }).select('courseId');
  
  return enrollments.map(e => e.courseId);
}