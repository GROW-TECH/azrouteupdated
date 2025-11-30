'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import {
  CheckCircle,
  Clock,
  Globe,
  Award,
  RefreshCcw,
  ShieldCheck,
  Loader2,
  ArrowLeft,
  CreditCard
} from "lucide-react";
import { loadStripe } from '@stripe/stripe-js';
import { use } from 'react';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function CourseCheckout({ params }) {
  const router = useRouter();
  const { toast } = useToast();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [discount, setDiscount] = useState(null);
  const {courseId}=use(params)
  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/details`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      // Redirect if course is free or user is already enrolled
      if (data.course.price === 0 || data.userEnrollment) {
        router.push(`/courses/${courseId}`);
        return;
      }

      setCourse(data.course);
    } catch (error) {
      console.error('Error fetching course details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load course details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const validatePromoCode = async () => {
    try {
      setPromoError('');
      
      const response = await fetch('/api/courses/promo/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: promoCode,
          courseId: courseId
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      setDiscount(data.discount);
      toast({
        title: 'Success',
        description: `Promo code applied: ${data.discount.percentage}% off`,
      });
    } catch (error) {
      console.error('Error validating promo code:', error);
      setPromoError(error.message || 'Invalid promo code');
    }
  };

  const handleCheckout = async () => {
    try {
      setProcessing(true);

      const response = await fetch('/api/student/courses/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: courseId,
          promoCode: discount ? promoCode : null
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId
      });

      if (error) throw new Error(error.message);

    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to process checkout',
        variant: 'destructive',
      });
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
        <Button onClick={() => router.push('/courses')}>
          Browse Courses
        </Button>
      </div>
    );
  }

  const finalPrice = discount
    ? course.price - (course.price * discount.percentage / 100)
    : course.price;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push(`/courses/${courseId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Course
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Checkout Form */}
        <div>
          <h1 className="text-2xl font-bold mb-6">Checkout</h1>

          <Card className="mb-6">
            <div className="p-6">
              <div className="mb-6">
                <h2 className="font-semibold mb-2">Order Summary</h2>
                <div className="flex justify-between items-center">
                  <span>{course.title}</span>
                  <span>£{course.price}</span>
                </div>
                {discount && (
                  <div className="flex justify-between items-center text-green-600 mt-2">
                    <span>Discount ({discount.percentage}% off)</span>
                    <span>-£{(course.price * discount.percentage / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t mt-4 pt-4">
                  <div className="flex justify-between items-center font-bold">
                    <span>Total:</span>
                    <span>£{finalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Promo Code</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={validatePromoCode}
                    disabled={!promoCode}
                  >
                    Apply
                  </Button>
                </div>
                {promoError && (
                  <p className="text-sm text-red-500 mt-1">{promoError}</p>
                )}
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay Now
                  </>
                )}
              </Button>
              
              <div className="text-center text-sm text-muted-foreground mt-4">
                <p>By completing your purchase you agree to our</p>
                <p>
                  <a href="/terms" className="underline">Terms of Service</a>
                  {' & '}
                  <a href="/privacy" className="underline">Privacy Policy</a>
                </p>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Secure Checkout</h3>
                <p className="text-sm text-muted-foreground">
                  Your payment information is encrypted and secure
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <RefreshCcw className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">30-Day Money-Back Guarantee</h3>
                <p className="text-sm text-muted-foreground">
                  Not satisfied? Get a full refund within 30 days
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Course Summary */}
        <div>
          <Card>
            <div className="aspect-video relative overflow-hidden rounded-t-lg">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">{course.title}</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">What's included</h3>
                    <ul className="text-sm text-muted-foreground space-y-2 mt-2">
                      <li className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        {Math.ceil(course.totalDuration / 60)} hours on-demand video
                      </li>
                      <li className="flex items-center">
                        <Globe className="h-4 w-4 mr-2" />
                        Full lifetime access
                      </li>
                      <li className="flex items-center">
                        <Award className="h-4 w-4 mr-2" />
                        Certificate of completion
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}