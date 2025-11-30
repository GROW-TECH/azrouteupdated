"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { loadStripe } from '@stripe/stripe-js';
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  Calendar,
  Users,
  CheckCircle
} from "lucide-react";
import { use } from 'react';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function PaymentPage({ params }) {
  const router = useRouter();
  const { eventId } =use(params)
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [event, setEvent] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, processing, success, failed

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        const response = await fetch(`/api/student/payments/${eventId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch payment details');
        }
        const data = await response.json();
        setRegistration(data.registration);
        setEvent(data.event);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [eventId]);

  const handlePayment = async () => {
    try {
      setProcessing(true);
      setPaymentStatus('processing');

      // Create a payment session
      const response = await fetch('/api/student/payments/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          registrationId: registration.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment session');
      }

      const { sessionId } = await response.json();

      // Load Stripe and redirect to checkout
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (error) {
        throw new Error(error.message);
      }

    } catch (error) {
      setError(error.message);
      setPaymentStatus('failed');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button 
          className="mt-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Button 
        variant="ghost" 
        className="mb-6"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Complete Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Event Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{event?.title}</h3>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {formatDate(event?.startDate)}
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  {event?.currentRegistrations} registered
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium">Payment Summary</h4>
              <div className="flex justify-between text-sm">
                <span>{registration?.ticketTier.name}</span>
                <span>${registration?.ticketTier.price}</span>
              </div>
              <div className="pt-3 border-t flex justify-between font-medium">
                <span>Total</span>
                <span>${registration?.ticketTier.price}</span>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          {paymentStatus === 'processing' && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <AlertDescription>
                Processing your payment...
              </AlertDescription>
            </Alert>
          )}

          {paymentStatus === 'failed' && (
            <Alert variant="destructive">
              <AlertDescription>
                Payment failed. Please try again.
              </AlertDescription>
            </Alert>
          )}

          {paymentStatus === 'success' && (
            <Alert className="bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              <AlertDescription className="text-green-600">
                Payment successful! Redirecting...
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handlePayment}
            disabled={processing}
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Pay ${registration?.ticketTier.price}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}