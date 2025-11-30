// app/api/events/[eventId]/register/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Event from '@/models/Event';
import Registration from '@/models/Registration';
import { sendEmail } from '@/lib/email';

export async function POST(request, { params }) {
  try {
    const cookieStore =await cookies();
    const authToken = cookieStore.get('auth-token');

    if (!authToken) {
      return NextResponse.json(
        { error: 'Please login to register for events' },
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
    const { ticketTierId } = await request.json();

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user is already registered
    const existingRegistration = await Registration.findOne({
      eventId,
      userId: decoded.userId
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'You are already registered for this event' },
        { status: 400 }
      );
    }

    // Find event and validate registration
    const event = await Event.findOne({
      _id: eventId,
      status: 'published'
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Validate registration deadline
    if (new Date() > new Date(event.registrationDeadline)) {
      return NextResponse.json(
        { error: 'Registration deadline has passed' },
        { status: 400 }
      );
    }

    // Find and validate ticket tier
    const selectedTier = event.ticketTiers.find(
      tier => tier._id.toString() === ticketTierId
    );

    if (!selectedTier) {
      return NextResponse.json(
        { error: 'Invalid ticket tier' },
        { status: 400 }
      );
    }

    if (selectedTier.availableCount <= 0) {
      return NextResponse.json(
        { error: 'No tickets available for this tier' },
        { status: 400 }
      );
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create registration
      const registration = await Registration.create({
        eventId,
        userId: decoded.userId,
        ticketTier: {
          id: selectedTier._id,
          name: selectedTier.name,
          price: selectedTier.price
        },
        status: 'confirmed',
        registeredAt: new Date()
      });

      // Update ticket availability
      await Event.updateOne(
        {
          _id: eventId,
          'ticketTiers._id': ticketTierId
        },
        {
          $inc: {
            'ticketTiers.$.availableCount': -1
          }
        }
      );

      await session.commitTransaction();

      // Send confirmation email
      await sendEmail({
        to: decoded.email,
        subject: `Registration Confirmed - ${event.title}`,
        template: 'event-registration',
        data: {
          eventTitle: event.title,
          eventDate: event.startDate,
          ticketType: selectedTier.name,
          registrationId: registration._id
        }
      });

      return NextResponse.json({
        message: 'Registration successful',
        registration
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Error registering for event:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}