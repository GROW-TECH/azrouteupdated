import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  StopCircle,
  MessageCircle,
  Users,
  HelpCircle,
  Settings,
  BarChart2,
  Hand,
  Power
} from 'lucide-react';

const ControlButton = ({ active, onClick, disabled, children, variant = "ghost", className = "" }) => (
  <Button
    variant={variant}
    size="icon"
    className={`h-12 w-12 rounded-full bg-background/20 hover:bg-background/40 ${active ? 'ring-2 ring-primary' : ''} ${className}`}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </Button>
);

const HostControls = ({
  isCameraOn,
  isMicOn,
  isScreenSharing,
  isRecording,
  onToggleCamera,
  onToggleMic,
  onToggleScreenShare,
  onToggleRecording,
  onToggleChat,
  onToggleParticipants,
  onToggleQuestions,
  onToggleStats,
  onOpenSettings,
  onEndStream,
  raisedHandsCount = 0
}) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Primary Controls */}
      <div className="flex items-center justify-center gap-4">
        <ControlButton
          active={isCameraOn}
          onClick={onToggleCamera}
        >
          {isCameraOn ? (
            <Camera className="h-6 w-6" />
          ) : (
            <CameraOff className="h-6 w-6" />
          )}
        </ControlButton>

        <ControlButton
          active={isMicOn}
          onClick={onToggleMic}
        >
          {isMicOn ? (
            <Mic className="h-6 w-6" />
          ) : (
            <MicOff className="h-6 w-6" />
          )}
        </ControlButton>

        <ControlButton
          active={isScreenSharing}
          onClick={onToggleScreenShare}
        >
          {isScreenSharing ? (
            <MonitorOff className="h-6 w-6" />
          ) : (
            <Monitor className="h-6 w-6" />
          )}
        </ControlButton>

        <ControlButton
          active={isRecording}
          onClick={onToggleRecording}
          className="text-red-500"
        >
          {isRecording ? (
            <StopCircle className="h-6 w-6" />
          ) : (
            <Monitor className="h-6 w-6" />
          )}
        </ControlButton>

        <div className="h-8 w-px bg-border mx-2" />

        <ControlButton onClick={onToggleChat}>
          <MessageCircle className="h-6 w-6" />
        </ControlButton>

        <ControlButton onClick={onToggleParticipants}>
          <div className="relative">
            <Users className="h-6 w-6" />
            {raisedHandsCount > 0 && (
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                {raisedHandsCount}
              </div>
            )}
          </div>
        </ControlButton>

        <ControlButton onClick={onToggleQuestions}>
          <HelpCircle className="h-6 w-6" />
        </ControlButton>

        <ControlButton onClick={onToggleStats}>
          <BarChart2 className="h-6 w-6" />
        </ControlButton>

        <ControlButton onClick={onOpenSettings}>
          <Settings className="h-6 w-6" />
        </ControlButton>
      </div>

      {/* End Stream Button */}
      <div className="flex justify-center">
        <Button
          variant="destructive"
          size="lg"
          className="rounded-full px-8"
          onClick={onEndStream}
        >
          <Power className="h-5 w-5 mr-2" />
          End Stream
        </Button>
      </div>
    </div>
  );
};

export default HostControls;