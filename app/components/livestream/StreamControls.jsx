//components/livestream/StreamControls.jsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Monitor,
  StopCircle,
  Layout,
  Users,
  MessageSquare,
  Settings,
  Crown,
  Radio,
  HelpCircle,
  Phone,
  Grid,
  Presentation,
  Rows,
  CrownIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function StreamControls({
  // Media states
  isCameraOn = true,
  isMicOn = true,
  isScreenSharing = false,
  isRecording = false,
  
  // Layout
  currentLayout = 'grid',
  
  // Host controls
  isHost = false,
  raisedHandsCount = 0,
  
  // Event handlers
  onToggleCamera,
  onToggleMic,
  onToggleScreenShare,
  onToggleRecording,
  onChangeLayout,
  onToggleChat,
  onToggleParticipants,
  onToggleQuestions,
  onOpenSettings,
  onEndStream,
  
  // Optional features
  showRecording = true,
  showScreenShare = true,
  showLayoutControls = true,
  
  // Additional info
  participantCount = 0,
  streamDuration = 0
}) {
  const [showControls, setShowControls] = useState(true);

  // Helper to format duration
  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs}:` : ''}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Layout options
  const layouts = {
    grid: { icon: Grid, label: 'Grid View' },
    spotlight: { icon: Presentation, label: 'Spotlight' },
    sidebar: { icon: Rows, label: 'Sidebar' },
  };

  return (
    <div 
      className={cn(
        "fixed bottom-0 left-0 right-0 p-4 transition-all duration-300",
        "bg-gradient-to-t from-background/95 to-background/60",
        "flex items-center justify-between",
        !showControls && "translate-y-full"
      )}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Left Section - Stream Info */}
      <div className="flex items-center gap-4">
        <Badge variant="outline" className="gap-1">
          <Radio className="w-4 h-4 text-red-500" />
          Live
        </Badge>
        
        {streamDuration > 0 && (
          <span className="text-sm text-muted-foreground">
            {formatDuration(streamDuration)}
          </span>
        )}
      </div>

      {/* Center Section - Main Controls */}
      <div className="flex items-center gap-2">
        {/* Camera Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isCameraOn ? "outline" : "secondary"}
              size="icon"
              onClick={onToggleCamera}
            >
              {isCameraOn ? (
                <Camera className="w-4 h-4" />
              ) : (
                <CameraOff className="w-4 h-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isCameraOn ? 'Turn off camera' : 'Turn on camera'}
          </TooltipContent>
        </Tooltip>

        {/* Microphone Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isMicOn ? "outline" : "secondary"}
              size="icon"
              onClick={onToggleMic}
            >
              {isMicOn ? (
                <Mic className="w-4 h-4" />
              ) : (
                <MicOff className="w-4 h-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isMicOn ? 'Mute microphone' : 'Unmute microphone'}
          </TooltipContent>
        </Tooltip>

        {/* Screen Share */}
        {showScreenShare && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isScreenSharing ? "secondary" : "outline"}
                size="icon"
                onClick={onToggleScreenShare}
              >
                <Monitor className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isScreenSharing ? 'Stop sharing' : 'Share screen'}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Recording Control */}
        {showRecording && isHost && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isRecording ? "secondary" : "outline"}
                size="icon"
                onClick={onToggleRecording}
              >
                {isRecording ? (
                  <StopCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <CrownIcon className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isRecording ? 'Stop recording' : 'Start recording'}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Layout Control */}
        {showLayoutControls && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Layout className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {Object.entries(layouts).map(([key, { icon: Icon, label }]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => onChangeLayout?.(key)}
                  className={cn(
                    currentLayout === key && "bg-secondary"
                  )}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Right Section - Additional Controls */}
      <div className="flex items-center gap-2">
        {/* Participants */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleParticipants}
            >
              <div className="relative">
                <Users className="w-4 h-4" />
                {participantCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-xs"
                  >
                    {participantCount}
                  </Badge>
                )}
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Participants</TooltipContent>
        </Tooltip>

        {/* Chat */}
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleChat}
        >
          <MessageSquare className="w-4 h-4" />
        </Button>

        {/* Questions (Host Only) */}
        {isHost && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onToggleQuestions}
              >
                <div className="relative">
                  <HelpCircle className="w-4 h-4" />
                  {raisedHandsCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-xs"
                    >
                      {raisedHandsCount}
                    </Badge>
                  )}
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Questions & Raised Hands</TooltipContent>
          </Tooltip>
        )}

        {/* Settings */}
        <Button
          variant="outline"
          size="icon"
          onClick={onOpenSettings}
        >
          <Settings className="w-4 h-4" />
        </Button>

        {/* End Stream */}
        <Button
          variant="destructive"
          size="icon"
          onClick={onEndStream}
        >
          <Phone className="w-4 h-4 rotate-[135deg]" />
        </Button>
      </div>
    </div>
  );
}