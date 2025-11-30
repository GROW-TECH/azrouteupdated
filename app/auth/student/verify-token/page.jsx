'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

function VerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const [error, setError] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const token = searchParams.get('token');

  // Handle verification
  useEffect(() => {
    const verifyToken = async () => {
      try {
        if (!token) {
          setError('Verification token is missing');
          setStatus('error');
          return;
        }

        const response = await fetch(
          `/api/auth/student/verify-token?token=${encodeURIComponent(token)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Verification failed');
        }

        setStatus('success');
        setRedirectUrl(data.redirectUrl);
      } catch (err) {
        console.error('Verification error:', err);
        setError(err.message);
        setStatus('error');
      }
    };

    verifyToken();
  }, [token]);

  // Handle countdown and redirect
// Countdown timer setup
useEffect(() => {
  let countdownInterval;

  if (status === 'success' && redirectUrl) {
    countdownInterval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  return () => {
    if (countdownInterval) clearInterval(countdownInterval);
  };
}, [status, redirectUrl]);

// Handle redirection separately
useEffect(() => {
  if (redirectCountdown === 0 && redirectUrl) {
    router.push(redirectUrl);
  }
}, [redirectCountdown, redirectUrl, router]);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Email Verification</CardTitle>
        <CardDescription className="text-center">
          {status === 'verifying' && 'We are verifying your email address'}
          {status === 'success' && 'Your email has been verified'}
          {status === 'error' && 'Verification failed'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {status === 'verifying' && (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-gray-600">Please wait while we verify your email address...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-700">
                Email verified successfully! You will be redirected to the login page in {redirectCountdown} seconds...
              </AlertDescription>
            </Alert>
            <div className="flex justify-center">
              <Link href="/auth/student/login">
                <Button variant="link" className="text-blue-600">
                  Click here to login now
                </Button>
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                {error || 'Failed to verify email. The verification link may be invalid or expired.'}
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <div className="flex justify-center">
                <Link href="/auth/student/login">
                  <Button className="w-full">
                    Back to Login
                  </Button>
                </Link>
              </div>
              <div className="text-center text-sm text-gray-600">
                If you need a new verification link,{' '}
                <Link href="/auth/student/login" className="text-blue-600 hover:underline">
                  log in
                </Link>
                {' '}and request one from your account.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function VerifyTokenPage() {
  return (
    <div className="container mx-auto px-4 py-6 flex items-center justify-center min-h-[calc(100vh-5rem)]">
      <Suspense fallback={
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Loading...</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </CardContent>
        </Card>
      }>
        <VerificationContent />
      </Suspense>
    </div>
  );
}