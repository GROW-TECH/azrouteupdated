// app/api/student/payments/create-session/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
      email: student.email
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

export async function POST(req) {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { eventId, registrationId } = body;

    // Get event
    const { data: event, error: eventErr } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventErr || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get registration
    const { data: registration, error: regErr } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('id', registrationId)
      .eq('student_id', user.id)
      .eq('status', 'pending')
      .single();

    if (regErr || !registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    // Get ticket tier
    const ticketTier = event.ticket_tiers.find(tier => tier.id === registration.ticket_tier);

    if (!ticketTier) {
      return NextResponse.json({ error: 'Invalid ticket tier' }, { status: 400 });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: event.title,
              description: event.description?.substring(0, 255) || undefined,
              images: event.thumbnail ? [event.thumbnail] : undefined,
            },
            unit_amount: Math.round(ticketTier.price * 100), // Convert to pence
          },
          quantity: 1,
        },
      ],
      metadata: {
        eventId: event.id,
        registrationId: registration.id,
        studentId: user.id,
        studentEmail: user.email
      },
      customer_email: user.email,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/student/events/${eventId}/payment/status?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/student/events/${eventId}?payment=cancelled`,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating payment session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
