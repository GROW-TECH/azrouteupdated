// app/api/student/events/available/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Helper: Verify student authentication
async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');

  if (!token) return null;

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);

    const { data: student, error } = await supabase
      .from('students')
      .select('id, name, email')
      .eq('id', decoded.userId)
      .single();

    if (error || !student) return null;

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      role: 'student'
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

export async function GET(req) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch registered event IDs
    const { data: registrations } = await supabase
      .from('event_registrations')
      .select('eventId')
      .eq('studentId', user.id);

    const registeredEventIds = registrations?.map(r => r.eventId) || [];

    // Fetch available events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .not('id', 'in', `(${registeredEventIds.join(',') || 'NULL'})`)
      .eq('status', 'published')
      .gt('startDate', new Date().toISOString())
      .order('startDate', { ascending: true });

    if (eventsError) {
      console.error('Supabase events fetch error:', eventsError);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    // Format events
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      thumbnail: event.thumbnail,
      type: event.location?.type,
      startDate: event.startDate,
      endDate: event.endDate,
      durationHours: Math.ceil((new Date(event.endDate) - new Date(event.startDate)) / (1000 * 60 * 60)),
      category: event.category,
      location: event.location,
      currentRegistrations: event.currentRegistrations,
      maximumRegistrations: event.maximumRegistrations,
      ticketTiers: event.ticketTiers || [],
      isRegistrationOpen: event.isRegistrationOpen
    }));

    return NextResponse.json({ events: formattedEvents });
  } catch (error) {
    console.error('Error fetching available events:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
