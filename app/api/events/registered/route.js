// app/api/student/events/registered/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Event from '@/models/Event';
import EventRegistration from '@/models/EventRegistration';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    await connectDB();

    // Get registrations with event details
    const registrations = await EventRegistration
      .find({ studentId: decoded.userId })
      .populate('eventId')
      .sort({ registeredAt: -1 });

    // Format the response
    const events = registrations.map(registration => {
      const event = registration.eventId;
      return {
        id: event?._id,
        title: event?.title,
        description: event?.description,
        thumbnail: event?.thumbnail,
        type: event?.location.type,
        startDate: event?.startDate,
        endDate: event?.endDate,
        duration: Math.ceil((new Date(event?.endDate) - new Date(event?.startDate)) / (1000 * 60 * 60)),
        category: event?.category,
        location: event?.location,
        currentRegistrations: event?.currentRegistrations,
        registrationStatus: registration.status,
        ticketTier: registration.ticketTier
      };
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching registered events:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
