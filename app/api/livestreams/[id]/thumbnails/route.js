//app/api/livestreams/[id]/thumbnails/route.js

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
  deleteObject
} from 'firebase/storage';
import sharp from 'sharp';

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

// Get thumbnail
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

    const stream = await LiveStream.findOne({
      _id: id,
      $or: [
        { teacherId: user.id },
        { isPublic: true },
        { courseId: { $in: await getStudentCourses(user.id) } }
      ]
    })
    .select('thumbnail')
    .lean();

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found or unauthorized' },
        { status: 404 }
      );
    }

    if (!stream.thumbnail) {
      return NextResponse.json(
        { error: 'No thumbnail found' },
        { status: 404 }
      );
    }

    // Get signed URL for thumbnail
    const storageRef = ref(storage, stream.thumbnail);
    const url = await getDownloadURL(storageRef);

    return NextResponse.json({ url });

  } catch (error) {
    console.error('Error getting thumbnail:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Upload thumbnail
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
    const thumbnailFile = formData.get('thumbnail');

    if (!thumbnailFile) {
      return NextResponse.json(
        { error: 'Thumbnail file is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify stream ownership
    const stream = await LiveStream.findOne({
      _id: id,
      teacherId: user.id
    });

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found or unauthorized' },
        { status: 404 }
      );
    }

    // Process thumbnail image
    const buffer = Buffer.from(await thumbnailFile.arrayBuffer());
    const processedImage = await sharp(buffer)
      .resize(1280, 720, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Upload to storage
    const filename = `thumbnails/${id}/${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, processedImage, {
      contentType: 'image/jpeg',
      metadata: {
        teacherId: user.id,
        uploadedAt: new Date().toISOString()
      }
    });

    // Get download URL
    const url = await getDownloadURL(storageRef);

    // Delete old thumbnail if exists
    if (stream.thumbnail) {
      const oldRef = ref(storage, stream.thumbnail);
      try {
        await deleteObject(oldRef);
      } catch (error) {
        console.error('Error deleting old thumbnail:', error);
      }
    }

    // Update stream with new thumbnail
    await LiveStream.updateOne(
      { _id: id },
      {
        $set: {
          thumbnail: filename,
          thumbnailUrl: url
        }
      }
    );

    return NextResponse.json({
      success: true,
      thumbnail: {
        filename,
        url
      }
    });

  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Delete thumbnail
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

    // Verify stream ownership and get thumbnail
    const stream = await LiveStream.findOne({
      _id: id,
      teacherId: user.id
    })
    .select('thumbnail')
    .lean();

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found or unauthorized' },
        { status: 404 }
      );
    }

    if (!stream.thumbnail) {
      return NextResponse.json(
        { error: 'No thumbnail to delete' },
        { status: 404 }
      );
    }

    // Delete from storage
    const storageRef = ref(storage, stream.thumbnail);
    try {
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting from storage:', error);
    }

    // Remove from database
    await LiveStream.updateOne(
      { _id: id },
      {
        $unset: {
          thumbnail: 1,
          thumbnailUrl: 1
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Thumbnail deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting thumbnail:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Generate thumbnail from stream
export async function PUT(req, { params }) {
  try {
    const user = await verifyAuth();
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } =await params;
    const { timestamp } = await req.json();
    
    await connectDB();

    // Verify stream has recording
    const stream = await LiveStream.findOne({
      _id: id,
      teacherId: user.id,
      'recordings.0': { $exists: true }
    });

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found or no recording available' },
        { status: 404 }
      );
    }

    // Generate thumbnail from recording at timestamp
    // This would typically be handled by a video processing service
    // Here's a placeholder for the implementation
    const thumbnailBuffer = await generateThumbnailFromVideo(
      stream.recordings[0].url,
      timestamp
    );

    // Upload and process like normal thumbnail
    const filename = `thumbnails/${id}/${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, thumbnailBuffer, {
      contentType: 'image/jpeg',
      metadata: {
        teacherId: user.id,
        generatedAt: new Date().toISOString(),
        fromTimestamp: timestamp
      }
    });

    const url = await getDownloadURL(storageRef);

    // Update stream
    await LiveStream.updateOne(
      { _id: id },
      {
        $set: {
          thumbnail: filename,
          thumbnailUrl: url
        }
      }
    );

    return NextResponse.json({
      success: true,
      thumbnail: {
        filename,
        url
      }
    });

  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Helper function to generate thumbnail from video
async function generateThumbnailFromVideo(videoUrl, timestamp) {
  // This would be implemented using a video processing service
  // For now, return a placeholder implementation
  throw new Error('Video thumbnail generation not implemented');
}

async function getStudentCourses(studentId) {
  const enrollments = await Enrollment.find({
    studentId,
    status: 'active'
  }).select('courseId');
  
  return enrollments.map(e => e.courseId);
}