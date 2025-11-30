// app/api/teacher/events/[eventId]/status/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Event from '@/models/Event';
import Registration from '@/models/Registration';

export async function PATCH(request, { params }) {
  try {
    const cookieStore =await cookies();
    const authToken = cookieStore.get('auth-token');

    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token and teacher role
    const decoded = jwt.verify(authToken.value, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId || decoded.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const { eventId } =await params;
    const { status } = await request.json();
    console.log("eventID",eventId, status)

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        console.log("invalid eventID")
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['draft', 'published', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
        console.log("missing status")
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find event and verify ownership
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

    // Additional validations based on status change
    const currentDate = new Date();

    // Validation for status transitions
    switch (status) {
      case 'published':
        // Check required fields
        if (!event.title || !event.description || !event.startDate || !event.endDate || !event.thumbnail) {
          console.log("missing required field")
            return NextResponse.json(
            { error: 'Cannot publish event: missing required fields' },
            { status: 400 }
          );
        }

        // Validate dates for publishing
        if (new Date(event.startDate) < currentDate) {
            console.log("date issue")
          return NextResponse.json(
            { error: 'Cannot publish event: start date must be in the future' },
            { status: 400 }
          );
        }

        if (new Date(event.registrationDeadline) < currentDate) {
            console.log("date issue2")
          return NextResponse.json(
            { error: 'Cannot publish event: registration deadline must be in the future' },
            { status: 400 }
          );
        }
        break;

      case 'cancelled':
        // Check if event has registrations
        const registrationCount = await Registration.countDocuments({
          eventId: event?._id,
          status: 'confirmed'
        });

        if (registrationCount > 0) {
          // You might want to implement a notification system here
          // to alert registered users about the cancellation
          
          // Update all confirmed registrations to cancelled
          await Registration.updateMany(
            {
              eventId: event?._id,
              status: 'confirmed'
            },
            {
              $set: {
                status: 'cancelled',
                cancellationReason: 'Event cancelled by organizer'
              }
            }
          );
        }
        break;

      case 'completed':
        // Only allow completion for past events
        if (new Date(event.endDate) > currentDate) {
          return NextResponse.json(
            { error: 'Cannot mark as completed: event has not ended yet' },
            { status: 400 }
          );
        }
        break;

      case 'draft':
        // Check if event can be reverted to draft
        if (event.status === 'completed') {
          return NextResponse.json(
            { error: 'Cannot revert completed event to draft' },
            { status: 400 }
          );
        }

        const hasRegistrations = await Registration.exists({
          eventId: event?._id,
          status: { $in: ['confirmed', 'attended'] }
        });

        if (hasRegistrations) {
          return NextResponse.json(
            { error: 'Cannot revert to draft: event has active registrations' },
            { status: 400 }
          );
        }
        break;
    }

    // Update event status
    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: eventId,
        teacherId: decoded.userId
      },
      {
        $set: {
          status,
          updatedAt: currentDate
        }
      },
      { new: true }
    );

    if (!updatedEvent) {
      return NextResponse.json(
        { error: 'Failed to update event status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Event status updated to ${status}`,
      event: updatedEvent
    });

  } catch (error) {
    console.error('Error updating event status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}