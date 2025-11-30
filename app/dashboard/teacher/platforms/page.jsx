//app/dashboard/teacher/platforms/page.jsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/useAuth';
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  Link,
  ExternalLink,
  RefreshCcw,
  Settings,
  Check,
  AlertCircle,
  Unlink
} from 'lucide-react';

const PLATFORMS = {
  zoom: {
    name: 'Zoom',
    icon: Video,
    description: 'Connect your Zoom account to host meetings',
    permissions: [
      'View and manage meetings',
      'Start instant meetings',
      'View and manage recordings'
    ],
    docsUrl: 'https://marketplace.zoom.us/docs/guides/'
  },
  google: {
    name: 'Google Meet',
    icon: Video,
    description: 'Connect Google Meet to schedule and host meetings',
    permissions: [
      'View and manage meetings',
      'Access Google Calendar',
      'Manage recordings'
    ],
    docsUrl: 'https://developers.google.com/meet'
  },
  microsoft: {
    name: 'Microsoft Teams',
    icon: Video,
    description: 'Connect Teams for enterprise meeting integration',
    permissions: [
      'Create online meetings',
      'Access calendar',
      'Manage meeting recordings'
    ],
    docsUrl: 'https://docs.microsoft.com/en-us/graph/api/resources/onlinemeeting'
  }
};

export default function PlatformIntegrationPage() {
  const router = useRouter();
  const { user, loading } = useAuth('teacher');
  const [connections, setConnections] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(null);

  // Fetch current connections
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const response = await fetch('/api/user/platform-connections');
        if (response.ok) {
          const data = await response.json();
          setConnections(data.connections);
        }
      } catch (error) {
        console.error('Error fetching connections:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!loading && user) {
      fetchConnections();
    }
  }, [user, loading]);

  // Connect platform
  const handleConnect = async (platform) => {
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    // Open OAuth window
    const authWindow = window.open(
      `/api/auth/${platform}/authorize`,
      `Connect ${PLATFORMS[platform].name}`,
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // Handle OAuth callback
    window.addEventListener('message', async (event) => {
      if (event.data.type === 'PLATFORM_CONNECTED' && event.data.platform === platform) {
        authWindow.close();
        setConnections(prev => ({
          ...prev,
          [platform]: {
            connected: true,
            lastSync: new Date().toISOString()
          }
        }));
      }
    });
  };

  // Disconnect platform
  const handleDisconnect = async () => {
    if (!selectedPlatform) return;

    try {
      const response = await fetch(`/api/user/platform-connections/${selectedPlatform}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setConnections(prev => ({
          ...prev,
          [selectedPlatform]: {
            connected: false,
            lastSync: null
          }
        }));
      }
    } catch (error) {
      console.error('Error disconnecting platform:', error);
    } finally {
      setShowDisconnectDialog(false);
      setSelectedPlatform(null);
    }
  };

  // Refresh platform token
  const handleRefresh = async (platform) => {
    setRefreshing(platform);
    try {
      const response = await fetch(`/api/user/platform-connections/${platform}/refresh`, {
        method: 'POST'
      });

      if (response.ok) {
        setConnections(prev => ({
          ...prev,
          [platform]: {
            ...prev[platform],
            lastSync: new Date().toISOString()
          }
        }));
      }
    } catch (error) {
      console.error('Error refreshing platform:', error);
    } finally {
        setRefreshing(null);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Integrations</h1>
          <p className="text-muted-foreground mt-1">
            Manage your external meeting platform connections
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/teacher/livestreams')}
        >
          Back to Livestreams
        </Button>
      </div>

      {/* Platform Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(PLATFORMS).map(([platform, config]) => {
          const isConnected = connections[platform]?.connected;
          const PlatformIcon = config.icon;

          return (
            <Card key={platform} className={cn(
              "transition-colors",
              isConnected && "border-primary/50"
            )}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PlatformIcon className="h-5 w-5" />
                    <CardTitle>{config.name}</CardTitle>
                  </div>
                  {isConnected && (
                    <Badge variant="secondary" className="gap-1">
                      <Check className="h-3 w-3" />
                      Connected
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  {config.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Connection Status */}
                  {isConnected && (
                    <div className="text-sm text-muted-foreground">
                      Last synced: {new Date(connections[platform].lastSync).toLocaleString()}
                    </div>
                  )}

                  {/* Permissions */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Required Permissions:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {config.permissions.map((permission, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Check className="h-3 w-3" />
                          {permission}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between">
                {isConnected ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRefresh(platform)}
                      disabled={refreshing === platform}
                    >
                      <RefreshCcw className={cn(
                        "h-4 w-4 mr-2",
                        refreshing === platform && "animate-spin"
                      )} />
                      Refresh
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPlatform(platform);
                        setShowDisconnectDialog(true);
                      }}
                    >
                      <Unlink className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => handleConnect(platform)}>
                    <Link className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(config.docsUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Docs
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Integration Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stream Settings</CardTitle>
            <CardDescription>
              Configure default settings for external platform streams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/teacher/platforms/settings')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configure Settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>
              Resources for setting up platform integrations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => window.open('https://support.zoom.us', '_blank')}
              >
                Zoom Support
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('https://support.google.com/meet', '_blank')}
              >
                Meet Support
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('https://support.microsoft.com/teams', '_blank')}
              >
                Teams Support
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('/docs/integrations', '_blank')}
              >
                Integration Guide
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Disconnect Dialog */}
      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Platform</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect {selectedPlatform && PLATFORMS[selectedPlatform].name}?
              Any scheduled meetings will remain active.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You will need to reconnect the platform to create new meetings.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDisconnectDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}