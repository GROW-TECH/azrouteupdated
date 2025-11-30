// app/dashboard/student/courses/[courseId]/payment/status/page.jsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  RotateCcw
} from "lucide-react";
import { use } from 'react';

export default function PaymentStatusPage({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { courseId } =use(params);
  
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [course, setCourse] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        if (!sessionId) {
          setVerificationStatus('failed');
          return;
        }

        const response = await fetch('/api/student/courses/verify-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            courseId,
            sessionId
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setVerificationStatus('success');
          setCourse(data.course);
          // Show success toast
          toast({
            title: "Payment Successful",
            description: "You have successfully enrolled in the course!",
          });
        } else {
          setVerificationStatus('failed');
          throw new Error(data.error);
        }
      } catch (error) {
        setVerificationStatus('failed');
        toast({
          title: "Verification Failed",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [courseId, searchParams, toast]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-lg">Verifying your payment...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-lg mx-auto p-8">
      <Card>
        <CardContent className="pt-6 text-center">
          {verificationStatus === 'success' ? (
            <div className="space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold">Payment Successful!</h2>
              <p className="text-muted-foreground">
                You are now enrolled in {course?.title}
              </p>
              <div className="space-y-2">
                <Button 
                  className="w-full"
                  onClick={() => router.push(`/dashboard/student/courses/${courseId}/learn`)}
                >
                  Start Learning
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/dashboard/student/courses')}
                >
                  View All Courses
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <XCircle className="h-12 w-12 text-destructive mx-auto" />
              <h2 className="text-2xl font-bold">Payment Failed</h2>
              <p className="text-muted-foreground">
                We couldn't verify your payment. Please try again.
              </p>
              <div className="space-y-2">
                <Button 
                  className="w-full"
                  onClick={() => router.push(`/dashboard/student/courses/${courseId}`)}
                >
                  Try Again
                  <RotateCcw className="h-4 w-4 ml-2" />
                </Button>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/dashboard/student/courses')}
                >
                  Browse Other Courses
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}