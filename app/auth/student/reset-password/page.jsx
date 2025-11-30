'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

function ResetPasswordForm({ token }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  const SPECIAL_CHARS = '!@#$%^&*(),.?{}';

  const validatePassword = (password) => {
    const checks = {
      length: password.length >= 10,
      numbers: (password.match(/\d/g) || []).length >= 2,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      special: new RegExp(`[${SPECIAL_CHARS}]`).test(password)
    };
    return Object.values(checks).every(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!validatePassword(formData.password)) {
      setError('Password must be at least 10 characters long and contain two numbers, one uppercase letter, one lowercase letter, and one special character');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/student/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      router.push('/auth/student/login?success=' + encodeURIComponent('Password reset successfully. Please log in with your new password.'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <Input
          id="password"
          type="password"
          required
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
        <div className="text-sm text-gray-500 space-y-1">
          Password must contain:
          <ul className="list-disc list-inside">
            <li>At least 10 characters</li>
            <li>Two numbers</li>
            <li>One uppercase letter</li>
            <li>One lowercase letter</li>
            <li>One special character ({SPECIAL_CHARS})</li>
          </ul>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          required
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading}
      >
        {loading ? 'Resetting Password...' : 'Reset Password'}
      </Button>
    </form>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      router.push('/auth/student/login');
    }
  }, [token, router]);

  if (!token) return null;

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
        <CardDescription className="text-center">
          Enter your new password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm token={token} />
      </CardContent>
    </Card>
  );
}

// Loading fallback component
function LoadingCard() {
  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Loading...</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 animate-pulse">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="container mx-auto px-4 py-6 flex items-center justify-center min-h-[calc(100vh-5rem)]">
      <Suspense fallback={<LoadingCard />}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}