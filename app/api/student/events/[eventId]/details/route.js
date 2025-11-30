// app/api/student/events/[eventId]/details/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Event from '@/models/Event';
import EventRegistration from '@/models/EventRegistration';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET(req, { params }) {
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
    const {eventId}=await params
    // Get event and registration details
    const [event, registration] = await Promise.all([
      Event.findById(eventId),
      EventRegistration.findOne({
        eventId: eventId,
        studentId: decoded.userId
      })
    ]);

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Format the response
    const formattedEvent = {
      id: event?._id,
      title: event.title,
      description: event.description,
      thumbnail: event.thumbnail,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      category: event.category,
      currentRegistrations: event.currentRegistrations,
      maximumRegistrations: event.maximumRegistrations,
      ticketTiers: event.ticketTiers.map(tier => ({
        id: tier._id,
        name: tier.name,
        price: tier.price,
        benefits: tier.benefits,
        availableCount: tier.availableCount
      })),
      prerequisites: event.prerequisites,
      agenda: event.agenda.map(item => ({
        time: item.time,
        title: item.title,
        description: item.description
      })),
      speakers: event.speakers.map(speaker => ({
        name: speaker.name,
        bio: speaker.bio,
        avatar: speaker.avatar,
        designation: speaker.designation,
        company: speaker.company
      })),
      resources: event.resources,
      isRegistrationOpen: event.isRegistrationOpen
    };

    // Format registration if it exists
    let formattedRegistration = null;
    if (registration) {
      const ticketTier = event.ticketTiers.id(registration.ticketTier);
      formattedRegistration = {
        id: registration._id,
        status: registration.status,
        ticketTier: {
          id: ticketTier?._id,
          name: ticketTier?.name,
          price: ticketTier?.price
        },
        attendanceStatus: registration.attendanceStatus,
        certificateIssued: registration.certificateIssued,
        certificateUrl: registration.certificateUrl,
        additionalInfo: registration.additionalInfo
      };
    }

    return NextResponse.json({
      event: formattedEvent,
      registration: formattedRegistration
    });
  } catch (error) {
    console.error('Error fetching event details:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}