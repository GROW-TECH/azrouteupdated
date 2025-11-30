import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { LiveStream } from '@/models/LiveStream';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Helper function to verify authentication
async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return null;
    
    return {
      id: user._id.toString(),
      role: user.role
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

// Helper function to generate a secure access token
function generateAccessToken(recordingId, userId, expiresIn = '24h') {
  return jwt.sign(
    {
      recordingId,
      userId,
      timestamp: Date.now()
    },
    process.env.RECORDING_ACCESS_SECRET,
    { expiresIn }
  );
}

// Helper function to verify access permissions
async function verifyAccess(streamId, recordingId, userId, userRole) {
  const stream = await LiveStream.findById(streamId)
    .select('teacher recordings accessList')
    .lean();

  if (!stream) return false;

  // Teacher always has access
  if (userRole === 'teacher' && stream.teacher.toString() === userId) {
    return true;
  }

  // Check if recording exists and is published
  const recording = stream.recordings.find(
    rec => rec._id.toString() === recordingId
  );
  if (!recording || !recording.isPublished) {
    return false;
  }

  // Check access list
  const hasAccess = stream.accessList?.some(
    access => 
      access.userId.toString() === userId && 
      (!access.expiresAt || new Date(access.expiresAt) > new Date())
  );

  return hasAccess;
}

// GET endpoint to verify access and generate temporary access token
export async function GET(req, { params }) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: streamId, recordingId } = params;

    // Verify access permissions
    const hasAccess = await verifyAccess(streamId, recordingId, user.id, user.role);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Generate temporary access token
    const accessToken = generateAccessToken(recordingId, user.id);

    // Generate a secure playlist URL with the access token
    const playlistUrl = new URL(
      `/api/livestreams/${streamId}/recordings/${recordingId}/playlist`,
      process.env.NEXT_PUBLIC_API_URL
    );
    playlistUrl.searchParams.set('token', accessToken);

    return NextResponse.json({
      accessToken,
      playlistUrl: playlistUrl.toString(),
      expiresIn: '24h'
    });
  } catch (error) {
    console.error('Error generating access token:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST endpoint to grant access to specific users
export async function POST(req, { params }) {
  try {
    const user = await verifyAuth();
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: streamId, recordingId } = params;
    const body = await req.json();
    const { userIds, expiresIn } = body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid user IDs' },
        { status: 400 }
      );
    }

    // Calculate expiration date if provided
    const expiresAt = expiresIn 
      ? new Date(Date.now() + parseDuration(expiresIn))
      : null;

    // Update access list
    const result = await LiveStream.findOneAndUpdate(
      {
        _id: streamId,
        'recordings._id': recordingId,
        teacher: user.id
      },
      {
        $push: {
          accessList: {
            $each: userIds.map(userId => ({
              userId,
              grantedAt: new Date(),
              expiresAt,
              grantedBy: user.id
            }))
          }
        }
      },
      { new: true }
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Stream or recording not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Access granted successfully',
      accessList: result.accessList
    });
  } catch (error) {
    console.error('Error granting access:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Helper function to parse duration string to milliseconds
function parseDuration(duration) {
  const units = {
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000
  };

  const match = duration.match(/^(\d+)([hdw])$/);
  if (!match) {
    throw new Error('Invalid duration format');
  }

  const [_, value, unit] = match;
  return parseInt(value) * units[unit];
}

// DELETE endpoint to revoke access
export async function DELETE(req, { params }) {
  try {
    const user = await verifyAuth();
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: streamId, recordingId } = params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Remove user from access list
    const result = await LiveStream.findOneAndUpdate(
      {
        _id: streamId,
        'recordings._id': recordingId,
        teacher: user.id
      },
      {
        $pull: {
          accessList: { userId }
        }
      },
      { new: true }
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Stream or recording not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Access revoked successfully',
      accessList: result.accessList
    });
  } catch (error) {
    console.error('Error revoking access:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}