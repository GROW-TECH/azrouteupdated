// app/api/teacher/events/[eventId]/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Event from '@/models/Event';
import mongoose from 'mongoose';
import { deleteFromFirebase } from '@/lib/firebase';

// Get single event
export async function GET(request, { params }) {
  try {
    const cookieStore =await cookies();
    const authToken =  cookieStore.get('auth-token');

    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(authToken.value, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId || decoded.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const { eventId } =await params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const event = await Event.findOne({
      _id: eventId,
      teacherId: decoded.userId
    }).lean();

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(event);

  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Update event
export async function PUT(request, { params }) {
  try {
    const cookieStore =await cookies();
    const authToken =  cookieStore.get('auth-token');

    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(authToken.value, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId || decoded.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const { eventId } =await params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    await connectDB();
    const eventData = await request.json();

    // Validate dates
    const startDate = new Date(eventData.startDate);
    const endDate = new Date(eventData.endDate);
    const registrationDeadline = new Date(eventData.registrationDeadline);

    if (endDate < startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    if (registrationDeadline > startDate) {
      return NextResponse.json(
        { error: 'Registration deadline must be before event start date' },
        { status: 400 }
      );
    }

    // Update event
    const event = await Event.findOneAndUpdate(
      {
        _id: eventId,
        teacherId: decoded.userId
      },
      {
        $set: {
          ...eventData,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    );

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Event updated successfully',
      event
    });

  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Delete event
export async function DELETE(request, { params }) {
  try {
    const cookieStore =await cookies();
    const authToken =  cookieStore.get('auth-token');

    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(authToken.value, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId || decoded.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const { eventId } =await params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find event first to get image references
    const event = await Event.findOne({
      _id: eventId,
      teacherId: decoded.userId
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete images from Firebase
    if (event.thumbnail) {
      await deleteFromFirebase(event.thumbnail);
    }

    // Delete speaker avatars
    for (const speaker of event.speakers) {
      if (speaker.avatar) {
        await deleteFromFirebase(speaker.avatar);
      }
    }

    // Delete event and related data
    await Promise.all([
      Event.deleteOne({ _id: eventId }),
      // Add any other cleanup here (e.g., registrations, notifications, etc.)
    ]);

    return NextResponse.json({
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Update event status
export async function PATCH(request, { params }) {
  try {
    const cookieStore =await cookies();
    const authToken =  cookieStore.get('auth-token');

    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(authToken.value, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId || decoded.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const { eventId } =await params;
    const { status } = await request.json();

    if (!['draft', 'published', 'cancelled', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    await connectDB();

    const event = await Event.findOneAndUpdate(
      {
        _id: eventId,
        teacherId: decoded.userId
      },
      {
        $set: {
          status,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `Event status updated to ${status}`,
      event
    });

  } catch (error) {
    console.error('Error updating event status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}