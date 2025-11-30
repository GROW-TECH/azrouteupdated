// app/courses/[courseId]/checkout/success/page.jsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Loader2,
  ArrowRight,
  PlayCircle
} from "lucide-react";
import { use } from 'react';

export default function CheckoutSuccess({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState(null);
  const [courseTitle, setCourseTitle] = useState('');
  const {courseId}=use(params)
  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        if (!sessionId) {
          throw new Error('No session ID found');
        }

        const response = await fetch('/api/student/courses/verify-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            courseId: courseId
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to verify payment');
        }

        setCourseTitle(data.course.title);
      } catch (error) {
        console.error('Payment verification error:', error);
        setError(error.message);
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [courseId, searchParams]);

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold">Verifying your payment...</h2>
          <p className="text-sm text-muted-foreground">Please wait</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card className="p-6 text-center">
          <div className="text-red-500 mb-4">
            <XCircle className="h-12 w-12 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Payment Verification Failed</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button
            onClick={() => router.push(`/courses/${courseId}/checkout`)}
            className="w-full"
          >
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card className="p-6 text-center">
        <div className="text-green-500 mb-4">
          <CheckCircle className="h-12 w-12 mx-auto" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-muted-foreground mb-6">
          You are now enrolled in {courseTitle}
        </p>
        <div className="space-y-3">
          <Button
            className="w-full"
            onClick={() => router.push(`/learn/${courseId}`)}
          >
            <PlayCircle className="h-4 w-4 mr-2" />
            Start Learning
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push('/dashboard/student/courses')}
          >
            View All Courses
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
}