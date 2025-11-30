//app/livestream/[id]/page.jsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/useAuth';
import { useToast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Video,
  Users,
  Calendar,
  ExternalLink,
  LogIn,
  Globe,
  Lock,
} from 'lucide-react';
import { use } from 'react';

export default function StreamPreviewPage({ params }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [stream, setStream] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const {id}=use(params)
  // Fetch stream details
  useEffect(() => {
    const fetchStream = async () => {
      try {
        const response = await fetch(`/api/livestreams/${id}/preview`);
        if (response.ok) {
          const data = await response.json();
          setStream(data.stream);
        }
      } catch (error) {
        console.error('Error fetching stream:', error);
        toast({
          title: "Error",
          description: "Failed to load stream details",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStream();
  }, [id]);

  // Join stream handler
  const handleJoin = async () => {
    if (!user) {
      // Redirect to login with return URL
      router.push(`/login?returnUrl=/livestream/${id}`);
      return;
    }

    try {
      const response = await fetch(`/api/livestreams/${id}/join`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to join stream');
      
      const data = await response.json();

      // Handle external platform streams
      if (data.type === 'external') {
        window.open(data.url, '_blank');
        return;
      }

      // Redirect to appropriate stream view
      const basePath = user.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student';
      router.push(`${basePath}/livestreams/${id}`);

    } catch (error) {
      console.error('Error joining stream:', error);
      toast({
        title: "Error",
        description: "Failed to join stream",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Stream Not Found</CardTitle>
            <CardDescription className="text-center">
              This stream may have ended or is not available.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{stream.title}</CardTitle>
              <CardDescription className="mt-2">
                By {stream.teacherName}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {stream.isPublic ? (
                <Globe className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Lock className="w-4 h-4 text-muted-foreground" />
              )}
              <Badge variant="secondary">
                {stream.status === 'live' ? 'Live Now' : 'Scheduled'}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Stream Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                {stream.statistics?.currentViewers || 0} viewers
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                {stream.scheduledFor
                  ? new Date(stream.scheduledFor).toLocaleString()
                  : 'Started ' + new Date(stream.startedAt).toLocaleString()
                }
              </span>
            </div>
          </div>

          {/* Stream Description */}
          {stream.description && (
            <p className="text-sm text-muted-foreground">
              {stream.description}
            </p>
          )}

          {/* Course Info */}
          {stream.courseName && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Course:</span>
              {stream.courseName}
            </div>
          )}

          {/* Platform Info */}
          {stream.type !== 'native' && (
            <div className="flex items-center gap-2 text-sm">
              <ExternalLink className="w-4 h-4" />
              <span>
                This stream will take place on {stream.settings.platform}
              </span>
            </div>
          )}

          {/* Join Requirements */}
          {!user && (
            <div className="rounded-lg bg-secondary/10 p-4">
              <h4 className="font-medium mb-2">
                Sign in to join this stream
              </h4>
              <p className="text-sm text-muted-foreground">
                You need to be signed in to participate in this live stream.
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            Back to Dashboard
          </Button>
          <Button
            onClick={handleJoin}
            disabled={stream.status !== 'live'}
          >
            {!user ? (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Sign in to Join
              </>
            ) : stream.status === 'live' ? (
              <>
                <Video className="w-4 h-4 mr-2" />
                Join Stream
              </>
            ) : (
              'Stream Not Live'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}