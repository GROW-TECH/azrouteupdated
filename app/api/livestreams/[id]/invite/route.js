//app/api/livestreams/[id]/invite/route.js

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { LiveStream } from '@/models/LiveStream';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { sendEmail } from '@/lib/email';

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
    return null;
  }
}

// Get invite settings/list
export async function GET(req, { params }) {
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

    const stream = await LiveStream.findOne({
      _id: id,
      teacherId: user.id
    })
    .select('invites settings.requireRegistration')
    .lean();

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      invites: stream.invites || [],
      settings: {
        requireRegistration: stream.settings?.requireRegistration
      }
    });

  } catch (error) {
    console.error('Error fetching invites:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Send invites
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
    const { emails, message } = await req.json();

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email list' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get stream details
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

    // Generate invite links with tokens
    const invites = emails.map(email => ({
      email,
      token: jwt.sign(
        { streamId: id, email },
        process.env.JWT_SECRET,
        // { expiresIn: '7d' }
      ),
      sentAt: new Date(),
      sentBy: user.id
    }));

    // Update stream with invites
    await LiveStream.updateOne(
      { _id: id },
      { $push: { invites: { $each: invites } } }
    );

    // Send invite emails
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    await Promise.all(invites.map(invite => {
      const inviteUrl = `${baseUrl}/livestream/${id}?token=${invite.token}`;
      return sendEmail({
        to: invite.email,
        subject: `Invitation to join ${stream.title}`,
        template: 'stream-invite',
        variables: {
          streamTitle: stream.title,
          teacherName: user.name,
          streamDate: stream.scheduledFor ? 
            new Date(stream.scheduledFor).toLocaleString() : 
            'Live now',
          inviteUrl,
          customMessage: message,
          streamDescription: stream.description
        }
      });
    }));

    return NextResponse.json({
      success: true,
      invitedCount: emails.length
    });

  } catch (error) {
    console.error('Error sending invites:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Revoke invite
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
    const { token } = await req.json();

    await connectDB();

    // Remove invite
    const result = await LiveStream.updateOne(
      {
        _id: id,
        teacherId: user.id,
        'invites.token': token
      },
      { $pull: { invites: { token } } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Invite not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invite revoked successfully'
    });

  } catch (error) {
    console.error('Error revoking invite:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}