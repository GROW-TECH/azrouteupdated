// app/api/events/[eventId]/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Event from '@/models/Event';
import Registration from '@/models/Registration';
import { deleteFromFirebase } from '@/lib/firebase';

// Get single event
export async function GET(request, { params }) {
  try {
    const { eventId } =await params;
    const cookieStore =await cookies();
    const authToken = cookieStore.get('auth-token');
    let userId;

    // If user is authenticated, get their ID
    if (authToken) {
      try {
        const decoded = jwt.verify(authToken.value, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (error) {
        console.error('Invalid token:', error);
      }
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    await connectDB();

    // Base query
    const query = {
      _id: eventId,
      $or: [
        { status: 'published' },
        { status: 'draft', teacherId: userId } // Allow teachers to view their own draft events
      ]
    };

    const event = await Event.findOne(query)
      .populate('teacherId', 'name avatar bio designation organization')
      .lean();

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // If user is authenticated, check their registration status
    let userRegistration = null;
    if (userId) {
      userRegistration = await Registration.findOne({
        eventId,
        userId,
      }).lean();
    }

    // Get registration count
    const registrationCount = await Registration.countDocuments({
      eventId,
      status: { $in: ['confirmed', 'attended'] }
    });

    // Enhance event data with additional information
    const enhancedEvent = {
      ...event,
      registrationCount,
      isRegistered: !!userRegistration,
      userRegistration,
      canEdit: userId && event.teacherId._id.toString() === userId,
    };

    return NextResponse.json(enhancedEvent);
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
    const authToken = cookieStore.get('auth-token');

    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(authToken.value, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    const { eventId } =await params;
    const updateData = await request.json();

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find existing event to check ownership
    const existingEvent = await Event.findById(eventId);
    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (existingEvent.teacherId.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: 'Unauthorized to modify this event' },
        { status: 403 }
      );
    }

    // Validate dates
    const startDate = new Date(updateData.startDate);
    const endDate = new Date(updateData.endDate);
    const registrationDeadline = new Date(updateData.registrationDeadline);
    const currentDate = new Date();

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

    // If event is published, validate future dates
    if (updateData.status === 'published') {
      if (startDate < currentDate) {
        return NextResponse.json(
          { error: 'Start date must be in the future for published events' },
          { status: 400 }
        );
      }
      if (registrationDeadline < currentDate) {
        return NextResponse.json(
          { error: 'Registration deadline must be in the future for published events' },
          { status: 400 }
        );
      }
    }

    // Update event with validation
    const updatedEvent = await Event.findOneAndUpdate(
      { _id: eventId, teacherId: decoded.userId },
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      },
      {
        new: true,
        runValidators: true
      }
    ).populate('teacherId', 'name avatar bio designation organization');

    if (!updatedEvent) {
      return NextResponse.json(
        { error: 'Failed to update event' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Event updated successfully',
      event: updatedEvent
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
    const authToken = cookieStore.get('auth-token');

    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(authToken.value, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
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

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find and verify event ownership
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

      // Check if event has any registrations
      const registrationCount = await Registration.countDocuments({ eventId });
      if (registrationCount > 0) {
        return NextResponse.json(
          { error: 'Cannot delete event with existing registrations' },
          { status: 400 }
        );
      }

      // Delete images from Firebase
      const deletePromises = [];
      if (event.thumbnail) {
        deletePromises.push(deleteFromFirebase(event.thumbnail));
      }
      
      event.speakers.forEach(speaker => {
        if (speaker.avatar) {
          deletePromises.push(deleteFromFirebase(speaker.avatar));
        }
      });

      await Promise.all(deletePromises);

      // Delete the event
      await Event.deleteOne({ _id: eventId });

      // Commit transaction
      await session.commitTransaction();

      return NextResponse.json({
        message: 'Event deleted successfully'
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
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
    const authToken = cookieStore.get('auth-token');

    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(authToken.value, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    const { eventId } =await params;
    const { status } = await request.json();

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    const validStatuses = ['draft', 'published', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
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

    // Additional validations based on status
    const currentDate = new Date();
    if (status === 'published') {
      // Validate required fields for publishing
      if (!event.title || !event.description || !event.startDate || !event.endDate) {
        return NextResponse.json(
          { error: 'Required fields missing for publishing' },
          { status: 400 }
        );
      }

      // Validate dates for publishing
      const startDate = new Date(event.startDate);
      if (startDate < currentDate) {
        return NextResponse.json(
          { error: 'Cannot publish event with past start date' },
          { status: 400 }
        );
      }
    }

    // Update event status
    const updatedEvent = await Event.findOneAndUpdate(
      { _id: eventId, teacherId: decoded.userId },
      {
        $set: {
          status,
          updatedAt: currentDate
        }
      },
      { new: true }
    ).populate('teacherId', 'name avatar bio designation organization');

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