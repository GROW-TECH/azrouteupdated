//components/livestream/StreamSettings.jsx
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Settings,
  Video,
  Volume2,
  MessageSquare,
  Users,
  Globe,
  Lock,
  Save,
  AlertCircle
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SettingsSection = ({ title, description, children }) => (
  <div className="space-y-4 py-4">
    <div className="space-y-1">
      <h4 className="text-sm font-semibold">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const SettingItem = ({ label, description, children }) => (
  <div className="flex items-center justify-between">
    <div className="space-y-0.5">
      <Label>{label}</Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
    {children}
  </div>
);

export function StreamSettings({ 
  streamId, 
  isOpen, 
  onClose,
  onSettingsChange 
}) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('media');

  // Settings state
  const [settings, setSettings] = useState({
    media: {
      videoQuality: '720p',
      videoBitrate: 2500,
      audioQuality: 'high',
      audioBitrate: 128,
      frameRate: 30,
      echoCancellation: true,
      noiseSuppression: true,
    },
    chat: {
      enabled: true,
      onlyVerified: false,
      slowMode: false,
      slowModeDelay: 5,
      filterProfanity: true,
      allowLinks: false,
    },
    participants: {
      waitingRoom: false,
      allowScreenShare: false,
      allowAudio: false,
      autoAdmit: true,
      maxParticipants: 100,
    },
    recording: {
      autoRecord: false,
      saveChat: true,
      recordingQuality: 'high',
      maxDuration: 120,
    },
    visibility: {
      isPublic: false,
      allowReplays: true,
      listOnProfile: true,
      allowComments: true,
    }
  });

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`/api/livestreams/${streamId}/settings`);
        if (response.ok) {
          const data = await response.json();
          setSettings(data.settings);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast({
          title: "Error",
          description: "Failed to load stream settings",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchSettings();
    }
  }, [streamId, isOpen]);

  // Save settings
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/livestreams/${streamId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Settings saved successfully"
        });
        onSettingsChange?.(settings);
        onClose();
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Update settings helper
  const updateSettings = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Stream Settings</DialogTitle>
          <DialogDescription>
            Configure your stream settings and preferences
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="mt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5 gap-4">
                <TabsTrigger value="media">
                  <Video className="w-4 h-4 mr-2" />
                  Media
                </TabsTrigger>
                <TabsTrigger value="chat">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="participants">
                  <Users className="w-4 h-4 mr-2" />
                  Participants
                </TabsTrigger>
                <TabsTrigger value="recording">
                  {/* <Record className="w-4 h-4 mr-2" /> */}
                  Recording
                </TabsTrigger>
                <TabsTrigger value="visibility">
                  <Globe className="w-4 h-4 mr-2" />
                  Visibility
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[500px] mt-4 pr-4">
                <TabsContent value="media">
                  <SettingsSection
                    title="Video Settings"
                    description="Configure video quality and performance settings"
                  >
                    <SettingItem label="Video Quality">
                      <Select
                        value={settings.media.videoQuality}
                        onValueChange={(value) => updateSettings('media', 'videoQuality', value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1080p">1080p</SelectItem>
                          <SelectItem value="720p">720p</SelectItem>
                          <SelectItem value="480p">480p</SelectItem>
                          <SelectItem value="360p">360p</SelectItem>
                        </SelectContent>
                      </Select>
                    </SettingItem>

                    <SettingItem 
                      label="Video Bitrate" 
                      description={`${settings.media.videoBitrate}kbps`}
                    >
                      <Slider
                        value={[settings.media.videoBitrate]}
                        onValueChange={([value]) => updateSettings('media', 'videoBitrate', value)}
                        min={500}
                        max={8000}
                        step={500}
                        className="w-[200px]"
                      />
                    </SettingItem>

                    <SettingItem label="Frame Rate">
                      <Select
                        value={settings.media.frameRate.toString()}
                        onValueChange={(value) => updateSettings('media', 'frameRate', parseInt(value))}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="60">60 fps</SelectItem>
                          <SelectItem value="30">30 fps</SelectItem>
                          <SelectItem value="24">24 fps</SelectItem>
                        </SelectContent>
                      </Select>
                    </SettingItem>
                  </SettingsSection>

                  <SettingsSection
                    title="Audio Settings"
                    description="Configure audio quality and enhancement settings"
                  >
                    <SettingItem label="Audio Quality">
                      <Select
                        value={settings.media.audioQuality}
                        onValueChange={(value) => updateSettings('media', 'audioQuality', value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </SettingItem>

                    <SettingItem 
                      label="Audio Bitrate"
                      description={`${settings.media.audioBitrate}kbps`}
                    >
                      <Slider
                        value={[settings.media.audioBitrate]}
                        onValueChange={([value]) => updateSettings('media', 'audioBitrate', value)}
                        min={32}
                        max={320}
                        step={32}
                        className="w-[200px]"
                      />
                    </SettingItem>

                    <SettingItem label="Echo Cancellation">
                      <Switch
                        checked={settings.media.echoCancellation}
                        onCheckedChange={(checked) => updateSettings('media', 'echoCancellation', checked)}
                      />
                    </SettingItem>

                    <SettingItem label="Noise Suppression">
                      <Switch
                        checked={settings.media.noiseSuppression}
                        onCheckedChange={(checked) => updateSettings('media', 'noiseSuppression', checked)}
                      />
                    </SettingItem>
                  </SettingsSection>
                </TabsContent>

                <TabsContent value="chat">
                  <SettingsSection
                    title="Chat Settings"
                    description="Configure chat moderation and interaction settings"
                  >
                    <SettingItem label="Enable Chat">
                      <Switch
                        checked={settings.chat.enabled}
                        onCheckedChange={(checked) => updateSettings('chat', 'enabled', checked)}
                      />
                    </SettingItem>

                    <SettingItem label="Verified Users Only">
                      <Switch
                        checked={settings.chat.onlyVerified}
                        onCheckedChange={(checked) => updateSettings('chat', 'onlyVerified', checked)}
                      />
                    </SettingItem>

                    <SettingItem 
                      label="Slow Mode"
                      description={settings.chat.slowMode ? `${settings.chat.slowModeDelay} seconds delay` : undefined}
                    >
                      <div className="flex items-center gap-4">
                        <Switch
                          checked={settings.chat.slowMode}
                          onCheckedChange={(checked) => updateSettings('chat', 'slowMode', checked)}
                        />
                        {settings.chat.slowMode && (
                          <Select
                            value={settings.chat.slowModeDelay.toString()}
                            onValueChange={(value) => updateSettings('chat', 'slowModeDelay', parseInt(value))}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5s</SelectItem>
                              <SelectItem value="10">10s</SelectItem>
                              <SelectItem value="30">30s</SelectItem>
                              <SelectItem value="60">1m</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </SettingItem>

                    <SettingItem label="Filter Profanity">
                      <Switch
                        checked={settings.chat.filterProfanity}
                        onCheckedChange={(checked) => updateSettings('chat', 'filterProfanity', checked)}
                      />
                    </SettingItem>

                    <SettingItem label="Allow Links">
                      <Switch
                        checked={settings.chat.allowLinks}
                        onCheckedChange={(checked) => updateSettings('chat', 'allowLinks', checked)}
                      />
                    </SettingItem>
                  </SettingsSection>
                </TabsContent>

                <TabsContent value="participants">
                  <SettingsSection
                    title="Participant Settings"
                    description="Configure participant permissions and limitations"
                  >
                    <SettingItem label="Enable Waiting Room">
                      <Switch
                        checked={settings.participants.waitingRoom}
                        onCheckedChange={(checked) => updateSettings('participants', 'waitingRoom', checked)}
                      />
                    </SettingItem>

                    <SettingItem label="Allow Screen Sharing">
                      <Switch
                        checked={settings.participants.allowScreenShare}
                        onCheckedChange={(checked) => updateSettings('participants', 'allowScreenShare', checked)}
                      />
                    </SettingItem>

                    <SettingItem label="Allow Audio Participation">
                      <Switch
                        checked={settings.participants.allowAudio}
                        onCheckedChange={(checked) => updateSettings('participants', 'allowAudio', checked)}
                      />
                    </SettingItem>

                    <SettingItem label="Auto-Admit Participants">
                      <Switch
                        checked={settings.participants.autoAdmit}
                        onCheckedChange={(checked) => updateSettings('participants', 'autoAdmit', checked)}
                      />
                    </SettingItem>

                    <SettingItem 
                      label="Maximum Participants"
                      description="0 for unlimited"
                    >
                      <Input
                        type="number"
                        min="0"
                        max="1000"
                        value={settings.participants.maxParticipants}
                        onChange={(e) => updateSettings('participants', 'maxParticipants', parseInt(e.target.value))}
                        className="w-24"
                      />
                      //components/livestream/StreamSettings.jsx (continued)

</SettingItem>
</SettingsSection>
</TabsContent>

<TabsContent value="recording">
<SettingsSection
title="Recording Settings"
description="Configure stream recording preferences"
>
<SettingItem label="Auto-Record Stream">
  <Switch
    checked={settings.recording.autoRecord}
    onCheckedChange={(checked) => updateSettings('recording', 'autoRecord', checked)}
  />
</SettingItem>

<SettingItem label="Save Chat with Recording">
  <Switch
    checked={settings.recording.saveChat}
    onCheckedChange={(checked) => updateSettings('recording', 'saveChat', checked)}
  />
</SettingItem>

<SettingItem label="Recording Quality">
  <Select
    value={settings.recording.recordingQuality}
    onValueChange={(value) => updateSettings('recording', 'recordingQuality', value)}
  >
    <SelectTrigger className="w-32">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="high">High</SelectItem>
      <SelectItem value="medium">Medium</SelectItem>
      <SelectItem value="low">Low</SelectItem>
    </SelectContent>
  </Select>
</SettingItem>

<SettingItem 
  label="Maximum Duration"
  description="Maximum recording duration in minutes (0 for unlimited)"
>
  <Input
    type="number"
    min="0"
    max="480"
    value={settings.recording.maxDuration}
    onChange={(e) => updateSettings('recording', 'maxDuration', parseInt(e.target.value))}
    className="w-24"
  />
</SettingItem>

<Alert>
  <AlertCircle className="h-4 w-4" />
  <AlertDescription>
    Recordings are stored for 30 days and count towards your storage limit.
  </AlertDescription>
</Alert>
</SettingsSection>
</TabsContent>

<TabsContent value="visibility">
<SettingsSection
title="Visibility Settings"
description="Configure stream visibility and access settings"
>
<SettingItem 
  label="Stream Visibility"
  description="Control who can view your stream"
>
  <Select
    value={settings.visibility.isPublic ? "public" : "private"}
    onValueChange={(value) => updateSettings('visibility', 'isPublic', value === "public")}
  >
    <SelectTrigger className="w-32">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="public">
        <div className="flex items-center">
          <Globe className="w-4 h-4 mr-2" />
          Public
        </div>
      </SelectItem>
      <SelectItem value="private">
        <div className="flex items-center">
          <Lock className="w-4 h-4 mr-2" />
          Private
        </div>
      </SelectItem>
    </SelectContent>
  </Select>
</SettingItem>

<SettingItem label="Allow Stream Replays">
  <Switch
    checked={settings.visibility.allowReplays}
    onCheckedChange={(checked) => updateSettings('visibility', 'allowReplays', checked)}
  />
</SettingItem>

<SettingItem label="List on Profile">
  <Switch
    checked={settings.visibility.listOnProfile}
    onCheckedChange={(checked) => updateSettings('visibility', 'listOnProfile', checked)}
  />
</SettingItem>

<SettingItem label="Allow Comments">
  <Switch
    checked={settings.visibility.allowComments}
    onCheckedChange={(checked) => updateSettings('visibility', 'allowComments', checked)}
  />
</SettingItem>

{settings.visibility.isPublic && (
  <Alert>
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>
      Public streams can be viewed by anyone with the link.
      Make sure to review your other settings accordingly.
    </AlertDescription>
  </Alert>
)}
</SettingsSection>
</TabsContent>
</ScrollArea>
</Tabs>
</div>
)}

<DialogFooter>
<Button variant="outline" onClick={onClose}>
Cancel
</Button>
<Button 
onClick={handleSave}
disabled={isLoading || isSaving}
>
{isSaving ? (
<>
<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
Saving...
</>
) : (
<>
<Save className="w-4 h-4 mr-2" />
Save Changes
</>
)}
</Button>
</DialogFooter>
</DialogContent>
</Dialog>
);
}