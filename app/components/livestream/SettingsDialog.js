// components/livestream/SettingsDialog.js
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Switch } from "../../components/ui/switch";
import { Slider } from "../../components/ui/slider";
import { Badge } from "../../components/ui/badge";
import {
  Mic,
  Video,
  Volume2,
  Monitor,
  Keyboard,
  Webcam,
  Cog,
  Layout,
  CheckCircle2
} from "lucide-react";

export function SettingsDialog({
  isOpen,
  onClose,
  webrtcService
}) {
  const [activeTab, setActiveTab] = useState('audio');
  const [audioInputs, setAudioInputs] = useState([]);
  const [audioOutputs, setAudioOutputs] = useState([]);
  const [videoInputs, setVideoInputs] = useState([]);
  const [selectedAudioInput, setSelectedAudioInput] = useState('');
  const [selectedAudioOutput, setSelectedAudioOutput] = useState('');
  const [selectedVideoInput, setSelectedVideoInput] = useState('');
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [autoGainControl, setAutoGainControl] = useState(true);
  const [mirrorVideo, setMirrorVideo] = useState(true);
  const [lowBandwidth, setLowBandwidth] = useState(false);
  const [keyboardShortcuts, setKeyboardShortcuts] = useState(true);
  const [showNames, setShowNames] = useState(true);

  // Fetch available devices
  useEffect(() => {
    async function getDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        setAudioInputs(devices.filter(d => d.kind === 'audioinput'));
        setAudioOutputs(devices.filter(d => d.kind === 'audiooutput'));
        setVideoInputs(devices.filter(d => d.kind === 'videoinput'));

        // Set default selections
        const defaultAudioInput = devices.find(d => d.kind === 'audioinput');
        const defaultAudioOutput = devices.find(d => d.kind === 'audiooutput');
        const defaultVideoInput = devices.find(d => d.kind === 'videoinput');

        if (defaultAudioInput) setSelectedAudioInput(defaultAudioInput.deviceId);
        if (defaultAudioOutput) setSelectedAudioOutput(defaultAudioOutput.deviceId);
        if (defaultVideoInput) setSelectedVideoInput(defaultVideoInput.deviceId);

      } catch (error) {
        console.error('Error fetching devices:', error);
      }
    }

    if (isOpen) {
      getDevices();
    }
  }, [isOpen]);

  // Handle device changes
  const handleAudioInputChange = async (deviceId) => {
    try {
      if (webrtcService) {
        await webrtcService.changeAudioInput(deviceId);
        setSelectedAudioInput(deviceId);
      }
    } catch (error) {
      console.error('Error changing audio input:', error);
    }
  };

  const handleVideoInputChange = async (deviceId) => {
    try {
      if (webrtcService) {
        await webrtcService.changeVideoInput(deviceId);
        setSelectedVideoInput(deviceId);
      }
    } catch (error) {
      console.error('Error changing video input:', error);
    }
  };

  // Apply audio constraints
  const applyAudioConstraints = async () => {
    try {
      if (webrtcService) {
        await webrtcService.updateAudioConstraints({
          echoCancellation,
          noiseSuppression,
          autoGainControl
        });
      }
    } catch (error) {
      console.error('Error applying audio constraints:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="audio">
              <Mic className="w-4 h-4 mr-2" />
              Audio
            </TabsTrigger>
            <TabsTrigger value="video">
              <Video className="w-4 h-4 mr-2" />
              Video
            </TabsTrigger>
            <TabsTrigger value="general">
              <Cog className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
          </TabsList>

          {/* Audio Settings */}
          <TabsContent value="audio" className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Microphone</Label>
                <Select
                  value={selectedAudioInput}
                  onValueChange={handleAudioInputChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select microphone" />
                  </SelectTrigger>
                  <SelectContent>
                    {audioInputs.map(device => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microphone ${device.deviceId}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Speakers</Label>
                <Select
                  value={selectedAudioOutput}
                  onValueChange={setSelectedAudioOutput}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select speakers" />
                  </SelectTrigger>
                  <SelectContent>
                    {audioOutputs.map(device => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label || `Speaker ${device.deviceId}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Echo Cancellation</Label>
                  <Switch
                    checked={echoCancellation}
                    onCheckedChange={setEchoCancellation}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Noise Suppression</Label>
                  <Switch
                    checked={noiseSuppression}
                    onCheckedChange={setNoiseSuppression}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Auto Gain Control</Label>
                  <Switch
                    checked={autoGainControl}
                    onCheckedChange={setAutoGainControl}
                  />
                </div>
              </div>

              <Button onClick={applyAudioConstraints}>
                Apply Audio Settings
              </Button>
            </div>
          </TabsContent>

          {/* Video Settings */}
          <TabsContent value="video" className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Camera</Label>
                <Select
                  value={selectedVideoInput}
                  onValueChange={handleVideoInputChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select camera" />
                  </SelectTrigger>
                  <SelectContent>
                    {videoInputs.map(device => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${device.deviceId}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Mirror My Video</Label>
                  <Switch
                    checked={mirrorVideo}
                    onCheckedChange={setMirrorVideo}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Low Bandwidth Mode</Label>
                  <Switch
                    checked={lowBandwidth}
                    onCheckedChange={setLowBandwidth}
                  />
                </div>
              </div>

              {/* Video Preview */}
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  id="settings-preview"
                  autoPlay
                  playsInline
                  muted
                  className={cn(
                    "w-full h-full object-cover",
                    mirrorVideo && "scale-x-[-1]"
                  )}
                />
              </div>
            </div>
          </TabsContent>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Keyboard Shortcuts</Label>
                  <Switch
                    checked={keyboardShortcuts}
                    onCheckedChange={setKeyboardShortcuts}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Participant Names</Label>
                  <Switch
                    checked={showNames}
                    onCheckedChange={setShowNames}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Keyboard Shortcuts</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Toggle Mic</span>
                    <Badge variant="secondary">Alt + M</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Toggle Camera</span>
                    <Badge variant="secondary">Alt + V</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Share Screen</span>
                    <Badge variant="secondary">Alt + S</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Toggle Chat</span>
                    <Badge variant="secondary">Alt + C</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Toggle Participants</span>
                    <Badge variant="secondary">Alt + P</Badge>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
