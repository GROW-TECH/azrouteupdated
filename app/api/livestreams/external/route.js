//app/api/livestreams/external/route.js

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { LiveStream } from '@/models/LiveStream';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import axios from 'axios';

// Platform-specific API configurations
const platformConfigs = {
  zoom: {
    baseUrl: 'https://api.zoom.us/v2',
    headers: (token) => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    })
  },
  meet: {
    baseUrl: 'https://googleapis.com/calendar/v3',
    headers: (token) => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    })
  },
  teams: {
    baseUrl: 'https://graph.microsoft.com/v1.0',
    headers: (token) => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    })
  }
};

// Auth verification
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

// Create external meeting
export async function POST(req) {
  try {
    const user = await verifyAuth();
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { platform, title, description, scheduledFor, duration } = body;

    // Validate platform
    if (!['zoom', 'meet', 'teams'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform' },
        { status: 400 }
      );
    }

    // Get platform credentials from user settings
    const teacher = await Teacher.findById(user.id)
      .select('platformCredentials')
      .lean();

    const credentials = teacher?.platformCredentials?.[platform];
    if (!credentials) {
      return NextResponse.json(
        { error: `${platform} account not connected` },
        { status: 400 }
      );
    }

    // Create meeting on external platform
    let externalMeeting;
    switch (platform) {
      case 'zoom': {
        const response = await axios.post(
          `${platformConfigs.zoom.baseUrl}/users/me/meetings`,
          {
            topic: title,
            type: scheduledFor ? 2 : 1, // 1: instant, 2: scheduled
            start_time: scheduledFor,
            duration,
            settings: {
              join_before_host: false,
              waiting_room: true,
              mute_upon_entry: true
            }
          },
          { headers: platformConfigs.zoom.headers(credentials.accessToken) }
        );
        externalMeeting = {
          id: response.data.id,
          joinUrl: response.data.join_url,
          startUrl: response.data.start_url,
          password: response.data.password
        };
        break;
      }

      case 'meet': {
        const response = await axios.post(
          `${platformConfigs.meet.baseUrl}/calendar/v3/calendars/primary/events`,
          {
            summary: title,
            description,
            start: {
              dateTime: scheduledFor || new Date().toISOString(),
              timeZone: 'UTC'
            },
            end: {
              dateTime: new Date(new Date(scheduledFor || Date.now()).getTime() + duration * 60000).toISOString(),
              timeZone: 'UTC'
            },
            conferenceData: {
              createRequest: {
                requestId: Math.random().toString(36).substring(7),
                conferenceSolutionKey: { type: 'hangoutsMeet' }
              }
            }
          },
          { 
            headers: platformConfigs.meet.headers(credentials.accessToken),
            params: { conferenceDataVersion: 1 }
          }
        );
        externalMeeting = {
          id: response.data.id,
          joinUrl: response.data.hangoutLink,
          startUrl: response.data.hangoutLink
        };
        break;
      }

      case 'teams': {
        const response = await axios.post(
          `${platformConfigs.teams.baseUrl}/users/${credentials.userId}/onlineMeetings`,
          {
            subject: title,
            startDateTime: scheduledFor || new Date().toISOString(),
            endDateTime: new Date(new Date(scheduledFor || Date.now()).getTime() + duration * 60000).toISOString(),
            allowedPresenters: 'organizer'
          },
          { headers: platformConfigs.teams.headers(credentials.accessToken) }
        );
        externalMeeting = {
          id: response.data.id,
          joinUrl: response.data.joinUrl,
          startUrl: response.data.joinUrl
        };
        break;
      }
    }

    // Create livestream record
    await connectDB();
    const livestream = new LiveStream({
      teacherId: user.id,
      teacherName: user.name,
      title,
      description,
      type: platform,
      status: scheduledFor ? 'scheduled' : 'created',
      scheduledFor,
      duration,
      settings: {
        platform,
        meetingId: externalMeeting.id,
        meetingUrl: externalMeeting.joinUrl,
        startUrl: externalMeeting.startUrl,
        passcode: externalMeeting.password
      }
    });

    await livestream.save();

    return NextResponse.json({
      message: 'External meeting created successfully',
      livestream: {
        id: livestream._id,
        title: livestream.title,
        platform,
        joinUrl: externalMeeting.joinUrl,
        startUrl: externalMeeting.startUrl,
        passcode: externalMeeting.password
      }
    });

  } catch (error) {
    console.error('Error creating external meeting:', error);
    return NextResponse.json(
      { error: 'Failed to create external meeting' },
      { status: 500 }
    );
  }
}
