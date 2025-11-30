//app/api/platforms/webhooks/route.js

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { LiveStream } from '@/models/LiveStream';
import crypto from 'crypto';

// Webhook signature verification
function verifyZoomWebhook(request, signature) {
  const message = `v0:${request.headers.get('x-zm-request-timestamp')}:${request.body}`;
  const hashForVerify = crypto
    .createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET_TOKEN)
    .update(message)
    .digest('hex');
  return `v0=${hashForVerify}` === signature;
}

function verifyGoogleWebhook(token) {
  return token === process.env.GOOGLE_WEBHOOK_SECRET;
}

function verifyMicrosoftWebhook(token) {
  return token === process.env.MICROSOFT_WEBHOOK_SECRET;
}

export async function POST(req) {
  try {
    const platform = req.headers.get('x-platform');
    const body = await req.json();

    // Verify webhook signatures
    switch (platform) {
      case 'zoom': {
        const signature = req.headers.get('x-zm-signature');
        if (!verifyZoomWebhook(req, signature)) {
          return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 401 }
          );
        }
        break;
      }
      case 'google': {
        const token = req.headers.get('x-goog-webhook-token');
        if (!verifyGoogleWebhook(token)) {
          return NextResponse.json(
            { error: 'Invalid token' },
            { status: 401 }
          );
        }
        break;
      }
      case 'microsoft': {
        const token = req.headers.get('x-ms-webhook-token');
        if (!verifyMicrosoftWebhook(token)) {
          return NextResponse.json(
            { error: 'Invalid token' },
            { status: 401 }
          );
        }
        break;
      }
      default:
        return NextResponse.json(
          { error: 'Invalid platform' },
          { status: 400 }
        );
    }

    await connectDB();

    // Handle platform-specific events
    switch (platform) {
      case 'zoom': {
        await handleZoomEvent(body);
        break;
      }
      case 'google': {
        await handleGoogleEvent(body);
        break;
      }
      case 'microsoft': {
        await handleMicrosoftEvent(body);
        break;
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

async function handleZoomEvent(event) {
  const { event: eventType, payload } = event;

  switch (eventType) {
    case 'meeting.started': {
      await LiveStream.updateOne(
        { 'settings.meetingId': payload.object.id },
        {
          $set: {
            status: 'live',
            startedAt: new Date(),
            'settings.zoomData': {
              hostId: payload.object.host_id,
              joinUrl: payload.object.join_url,
              password: payload.object.password
            }
          }
        }
      );
      break;
    }

    case 'meeting.ended': {
      const endTime = new Date();
      await LiveStream.updateOne(
        { 'settings.meetingId': payload.object.id },
        {
          $set: {
            status: 'ended',
            endedAt: endTime,
            duration: payload.object.duration || Math.round((endTime - payload.object.start_time) / 60000)
          }
        }
      );
      break;
    }

    case 'meeting.participant_joined': {
      await LiveStream.updateOne(
        { 'settings.meetingId': payload.object.id },
        {
          $addToSet: { attendees: payload.object.participant.id },
          $inc: { 'statistics.totalViews': 1 },
          $max: { 'statistics.peakViewers': payload.object.participant_count }
        }
      );
      break;
    }

    case 'meeting.participant_left': {
      await LiveStream.updateOne(
        { 'settings.meetingId': payload.object.id },
        {
          $pull: { attendees: payload.object.participant.id }
        }
      );
      break;
    }

    case 'recording.completed': {
      await LiveStream.updateOne(
        { 'settings.meetingId': payload.object.id },
        {
          $push: {
            recordings: {
              platform: 'zoom',
              url: payload.object.recording_files[0].download_url,
              duration: payload.object.duration,
              startTime: payload.object.start_time,
              endTime: payload.object.end_time
            }
          }
        }
      );
      break;
    }
  }
}

async function handleGoogleEvent(event) {
  const { eventType, data } = event;

  switch (eventType) {
    case 'conference.started': {
      await LiveStream.updateOne(
        { 'settings.meetingId': data.conferenceId },
        {
          $set: {
            status: 'live',
            startedAt: new Date(),
            'settings.googleData': {
              conferenceData: data.conferenceData
            }
          }
        }
      );
      break;
    }

    case 'conference.ended': {
      const endTime = new Date();
      await LiveStream.updateOne(
        { 'settings.meetingId': data.conferenceId },
        {
          $set: {
            status: 'ended',
            endedAt: endTime,
            duration: Math.round((endTime - data.startTime) / 60000)
          }
        }
      );
      break;
    }

    case 'participant.joined': {
      await LiveStream.updateOne(
        { 'settings.meetingId': data.conferenceId },
        {
          $addToSet: { attendees: data.participant.id },
          $inc: { 'statistics.totalViews': 1 }
        }
      );
      break;
    }

    case 'participant.left': {
      await LiveStream.updateOne(
        { 'settings.meetingId': data.conferenceId },
        {
          $pull: { attendees: data.participant.id }
        }
      );
      break;
    }

    case 'recording.available': {
      await LiveStream.updateOne(
        { 'settings.meetingId': data.conferenceId },
        {
          $push: {
            recordings: {
              platform: 'google',
              url: data.recordingUrl,
              duration: data.duration,
              startTime: data.startTime,
              endTime: data.endTime
            }
          }
        }
      );
      break;
    }
  }
}

async function handleMicrosoftEvent(event) {
  const { eventType, resourceData } = event;

  switch (eventType) {
    case 'Microsoft.Teams.Meeting.Started': {
      await LiveStream.updateOne(
        { 'settings.meetingId': resourceData.id },
        {
          $set: {
            status: 'live',
            startedAt: new Date(),
            'settings.teamsData': {
              organizerId: resourceData.organizerId,
              joinUrl: resourceData.joinUrl
            }
          }
        }
      );
      break;
    }

    case 'Microsoft.Teams.Meeting.Ended': {
      const endTime = new Date();
      await LiveStream.updateOne(
        { 'settings.meetingId': resourceData.id },
        {
          $set: {
            status: 'ended',
            endedAt: endTime,
            duration: resourceData.duration || Math.round((endTime - resourceData.startTime) / 60000)
          }
        }
      );
      break;
    }

    case 'Microsoft.Teams.Meeting.ParticipantJoined': {
      await LiveStream.updateOne(
        { 'settings.meetingId': resourceData.meetingId },
        {
          $addToSet: { attendees: resourceData.participant.id },
          $inc: { 'statistics.totalViews': 1 }
        }
      );
      break;
    }

    case 'Microsoft.Teams.Meeting.ParticipantLeft': {
      await LiveStream.updateOne(
        { 'settings.meetingId': resourceData.meetingId },
        {
          $pull: { attendees: resourceData.participant.id }
        }
      );
      break;
    }

    case 'Microsoft.Teams.Meeting.RecordingReady': {
      await LiveStream.updateOne(
        { 'settings.meetingId': resourceData.meetingId },
        {
          $push: {
            recordings: {
              platform: 'teams',
              url: resourceData.recordingUrl,
              duration: resourceData.duration,
              startTime: resourceData.startTime,
              endTime: resourceData.endTime
            }
          }
        }
      );
      break;
    }
  }
}
