
// app/api/webhooks/stripe/route.js
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import EventRegistration from '@/models/EventRegistration';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
  try {
    const body = await req.text();
    const signature = headers().get('stripe-signature');

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await connectDB();

      // Update registration status
      await EventRegistration.findByIdAndUpdate(
        session.metadata.registrationId,
        {
          status: 'confirmed',
          paymentInfo: {
            amount: session.amount_total / 100,
            transactionId: session.payment_intent,
            paymentMethod: session.payment_method_types[0],
            paymentDate: new Date(),
            status: 'completed'
          }
        }
      );

      // Here you could also:
      // 1. Send confirmation email
      // 2. Generate ticket/QR code
      // 3. Update event statistics
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

