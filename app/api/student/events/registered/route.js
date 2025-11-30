// app/api/student/events/registered/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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
    const studentId = decoded.userId;

    // Get all registrations for this student
    const { data: registrations, error: regError } = await supabase
      .from('event_registrations')
      .select(`
        id,
        event_id,
        status,
        ticket_tier,
        registered_at,
        events (
          id,
          title,
          description,
          thumbnail,
          start_date,
          end_date,
          location,
          category,
          current_registrations
        )
      `)
      .eq('student_id', studentId)
      .order('registered_at', { ascending: false });

    if (regError) {
      console.error('Supabase registration fetch error:', regError);
      return NextResponse.json(
        { error: 'Failed to fetch registrations' },
        { status: 500 }
      );
    }

    // Format the response
    const events = registrations.map(registration => {
      const event = registration.events;
      return {
        id: event?.id,
        title: event?.title,
        description: event?.description,
        thumbnail: event?.thumbnail,
        type: event?.location?.type,
        startDate: event?.start_date,
        endDate: event?.end_date,
        duration: Math.ceil((new Date(event?.end_date) - new Date(event?.start_date)) / (1000 * 60 * 60)),
        category: event?.category,
        location: event?.location,
        currentRegistrations: event?.current_registrations,
        registrationStatus: registration.status,
        ticketTier: registration.ticket_tier
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
