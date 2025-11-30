
// app/auth/student/forgot-password/page.jsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

function ResendSection({ email, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/student/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend reset email");
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Alert className="mt-4 bg-green-50 text-green-700">
        <AlertDescription>
          If an account exists, a new password reset email will be sent. Please check your inbox and spam folder.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-sm font-medium mb-2">Haven't received the reset email?</h3>
      {error && (
        <Alert variant="destructive" className="mb-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex space-x-2">
        <Button
          onClick={handleResend}
          disabled={loading}
          variant="secondary"
          size="sm"
        >
          {loading ? "Sending..." : "Resend Reset Email"}
        </Button>
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
        >
          Close
        </Button>
      </div>
    </div>
  );
}

export default function StudentForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccess(false);
    setShowResend(false);

    try {
      const response = await fetch('/api/auth/student/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      setSuccess(true);
      
      // Show resend option after 30 seconds
      setTimeout(() => {
        setTimeoutReached(true);
      }, 30000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 flex items-center justify-center min-h-[calc(100vh-5rem)]">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            Enter your email address and we'll send you a password reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <div className="space-y-2">
                <Alert className="bg-green-50 text-green-700">
                  <AlertDescription>
                    If an account exists with this email, you will receive password reset instructions.
                  </AlertDescription>
                </Alert>
                
                {timeoutReached && !showResend && (
                  <div className="text-center">
                    <Button
                      variant="link"
                      className="text-sm text-blue-600"
                      onClick={() => setShowResend(true)}
                    >
                      Click here if you haven't received the reset email
                    </Button>
                  </div>
                )}
                
                {showResend && (
                  <ResendSection 
                    email={email}
                    onClose={() => setShowResend(false)}
                  />
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || success}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>

              <div className="text-center text-sm">
                Remember your password?{' '}
                <Link
                  href="/auth/student/login"
                  className="text-blue-600 hover:underline"
                >
                  Log in
                </Link>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}