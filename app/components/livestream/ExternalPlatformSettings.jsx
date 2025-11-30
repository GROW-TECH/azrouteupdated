//components/livestream/ExternalPlatformSettings.jsx
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Video,
  Link,
  CheckCircle,
  AlertCircle,
  RefreshCcw,
  ExternalLink,
} from 'lucide-react';

const PLATFORM_CONFIGS = {
  zoom: {
    name: 'Zoom',
    icon: Video,
    scopes: ['meeting:write', 'user:read'],
    connectUrl: '/api/auth/zoom'
  },
  meet: {
    name: 'Google Meet',
    icon: Video,
    scopes: ['https://www.googleapis.com/auth/calendar'],
    connectUrl: '/api/auth/google'
  },
  teams: {
    name: 'Microsoft Teams',
    icon: Video,
    scopes: ['OnlineMeetings.ReadWrite'],
    connectUrl: '/api/auth/microsoft'
  }
};

const PlatformCard = ({
  platform,
  isConnected,
  lastSync,
  onConnect,
  onDisconnect,
  onRefresh
}) => {
  const PlatformIcon = PLATFORM_CONFIGS[platform].icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlatformIcon className="w-5 h-5" />
          {PLATFORM_CONFIGS[platform].name}
          {isConnected && (
            <CheckCircle className="w-4 h-4 text-green-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isConnected ? (
            <>
              <div className="text-sm text-muted-foreground">
                Last synced: {new Date(lastSync).toLocaleString()}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDisconnect}
                >
                  Disconnect
                </Button>
              </div>
            </>
          ) : (
            <Button onClick={onConnect}>
              Connect {PLATFORM_CONFIGS[platform].name}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export function ExternalPlatformSettings() {
  const { toast } = useToast();
  const [platforms, setPlatforms] = useState({
    zoom: { connected: false, lastSync: null },
    meet: { connected: false, lastSync: null },
    teams: { connected: false, lastSync: null }
  });
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch platform connection status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/user/platform-connections');
        if (response.ok) {
          const data = await response.json();
          setPlatforms(data.platforms);
        }
      } catch (error) {
        console.error('Error fetching platform status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, []);

  // Connect platform
  const handleConnect = async (platform) => {
    // Open platform OAuth flow in popup
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      PLATFORM_CONFIGS[platform].connectUrl,
      `Connect ${PLATFORM_CONFIGS[platform].name}`,
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // Handle OAuth callback
    window.addEventListener('message', async (event) => {
      if (event.data.type === 'PLATFORM_CONNECTED' && event.data.platform === platform) {
        popup.close();
        
        setPlatforms(prev => ({
          ...prev,
          [platform]: {
            connected: true,
            lastSync: new Date().toISOString()
          }
        }));

        toast({
          title: 'Success',
          description: `Connected to ${PLATFORM_CONFIGS[platform].name}`
        });
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
        setPlatforms(prev => ({
          ...prev,
          [selectedPlatform]: {
            connected: false,
            lastSync: null
          }
        }));

        toast({
          title: 'Success',
          description: `Disconnected from ${PLATFORM_CONFIGS[selectedPlatform].name}`
        });
      }
    } catch (error) {
      console.error('Error disconnecting platform:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect platform',
        variant: 'destructive'
      });
    } finally {
      setShowDisconnectDialog(false);
      setSelectedPlatform(null);
    }
  };

  // Refresh platform connection
  const handleRefresh = async (platform) => {
    try {
      const response = await fetch(`/api/user/platform-connections/${platform}/refresh`, {
        method: 'POST'
      });

      if (response.ok) {
        setPlatforms(prev => ({
          ...prev,
          [platform]: {
            ...prev[platform],
            lastSync: new Date().toISOString()
          }
        }));

        toast({
          title: 'Success',
          description: `Refreshed ${PLATFORM_CONFIGS[platform].name} connection`
        });
      }
    } catch (error) {
      console.error('Error refreshing platform:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh platform connection',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

<div className="space-y-1">
  <h2 className="text-2xl font-bold">External Platforms</h2>
  <p className="text-muted-foreground">
    Connect your external meeting platforms to easily create and manage meetings
  </p>
</div>

{/* Platform Cards */}
<div className="grid gap-6 md:grid-cols-3">
  {Object.entries(platforms).map(([platform, status]) => (
    <PlatformCard
      key={platform}
      platform={platform}
      isConnected={status.connected}
      lastSync={status.lastSync}
      onConnect={() => handleConnect(platform)}
      onDisconnect={() => {
        setSelectedPlatform(platform);
        setShowDisconnectDialog(true);
      }}
      onRefresh={() => handleRefresh(platform)}
    />
  ))}
</div>

{/* Platform Scopes Info */}
<Alert>
  <AlertCircle className="h-4 w-4" />
  <AlertDescription>
    <p className="mb-2">
      The following permissions will be requested when connecting platforms:
    </p>
    <ul className="list-disc list-inside space-y-1">
      {Object.entries(PLATFORM_CONFIGS).map(([platform, config]) => (
        <li key={platform} className="text-sm">
          <span className="font-medium">{config.name}:</span>{' '}
          {config.scopes.join(', ')}
        </li>
      ))}
    </ul>
  </AlertDescription>
</Alert>

{/* Disconnect Confirmation Dialog */}
<Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Disconnect Platform</DialogTitle>
    </DialogHeader>
    
    <div className="py-4">
      <p>
        Are you sure you want to disconnect{' '}
        {selectedPlatform && PLATFORM_CONFIGS[selectedPlatform].name}?
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        All existing meetings will remain active, but you won't be able
        to create new ones until you reconnect.
      </p>
    </div>

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

{/* Connected Platforms Summary */}
<div className="border rounded-lg p-4">
  <h3 className="font-semibold mb-2">Quick Actions</h3>
  <div className="grid gap-4 md:grid-cols-2">
    {Object.entries(platforms).map(([platform, status]) => {
      if (!status.connected) return null;
      
      const PlatformIcon = PLATFORM_CONFIGS[platform].icon;
      
      return (
        <Button
          key={platform}
          variant="outline"
          className="justify-start"
          onClick={() => window.open(PLATFORM_CONFIGS[platform].connectUrl.replace('/auth', '/dashboard'))}
        >
          <PlatformIcon className="w-4 h-4 mr-2" />
          Open {PLATFORM_CONFIGS[platform].name} Dashboard
          <ExternalLink className="w-4 h-4 ml-2" />
        </Button>
      );
    })}
  </div>
</div>



{/* Help Section */}
<div className="border rounded-lg p-4 space-y-4">
  <h3 className="font-semibold">Need Help?</h3>
  <div className="grid gap-4 md:grid-cols-3">
    <a
      href="https://zoom.us/oauth/authorize"
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-blue-500 hover:underline flex items-center"
    >
      Zoom Developer Console
      <ExternalLink className="w-3 h-3 ml-1" />
    </a>
    <a
      href="https://console.cloud.google.com"
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-blue-500 hover:underline flex items-center"
    >
      Google Cloud Console
      <ExternalLink className="w-3 h-3 ml-1" />
    </a>
    <a
      href="https://portal.azure.com"
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-blue-500 hover:underline flex items-center"
    >
      Microsoft Azure Portal
      <ExternalLink className="w-3 h-3 ml-1" />
    </a>
  </div>
  <p className="text-sm text-muted-foreground">
    Need help setting up platform integrations? Check our{' '}
    <a href="/docs/external-platforms" className="text-blue-500 hover:underline">
      documentation
    </a>{' '}
    or{' '}
    <a href="/support" className="text-blue-500 hover:underline">
      contact support
    </a>.
  </p>
</div>
</div>
);
}