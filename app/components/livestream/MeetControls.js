import { Button } from "../../components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  MonitorUp,
  MessageSquare,
  Users,
  Settings,
  StopCircle
} from "lucide-react";

export function MeetControls({
  className,
  isMuted,
  isVideoEnabled,
  isScreenSharing,
  isRecording,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleRecording,
  onEndMeeting,
  onOpenSettings,
  participantCount,
  onToggleChat,
  onToggleParticipants
}) {
  const controls = [
    {
      group: "main",
      items: [
        {
          id: "audio",
          icon: isMuted ? MicOff : Mic,
          label: isMuted ? "Unmute (Alt+M)" : "Mute (Alt+M)",
          onClick: onToggleAudio,
          active: !isMuted,
          className: isMuted ? "bg-red-500/10 hover:bg-red-500/20" : ""
        },
        {
          id: "video",
          icon: isVideoEnabled ? Video : VideoOff,
          label: isVideoEnabled ? "Stop Video (Alt+V)" : "Start Video (Alt+V)",
          onClick: onToggleVideo,
          active: isVideoEnabled,
          className: !isVideoEnabled ? "bg-red-500/10 hover:bg-red-500/20" : ""
        },
        {
          id: "screen",
          icon: MonitorUp,
          label: isScreenSharing ? "Stop Sharing (Alt+S)" : "Share Screen (Alt+S)",
          onClick: onToggleScreenShare,
          active: isScreenSharing
        }
      ]
    },
    {
      group: "secondary",
      items: [
        {
          id: "recording",
          icon: isRecording ? StopCircle : Video,
          label: isRecording ? "Stop Recording (Alt+R)" : "Start Recording (Alt+R)",
          onClick: onToggleRecording,
          active: isRecording,
          className: isRecording ? "text-red-500" : ""
        },
        {
          id: "chat",
          icon: MessageSquare,
          label: "Chat (Alt+C)",
          onClick: onToggleChat,
          badge: true
        },
        {
          id: "participants",
          icon: Users,
          label: "Participants (Alt+P)",
          onClick: onToggleParticipants,
          badge: participantCount
        },
        {
          id: "settings",
          icon: Settings,
          label: "Settings",
          onClick: onOpenSettings
        }
      ]
    },
    {
      group: "end",
      items: [
        {
          id: "end-meeting",
          icon: PhoneOff,
          label: "End Meeting",
          onClick: onEndMeeting,
          variant: "destructive"
        }
      ]
    }
  ];

  const renderControl = (item) => (
    <TooltipProvider key={item.id}>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button
            variant={item.variant || "ghost"}
            size="icon"
            onClick={item.onClick}
            className={cn(
              "text-white hover:bg-white/20",
              item.active && "bg-white/20",
              item.className
            )}
          >
            {item.badge ? (
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {typeof item.badge === 'number' && (
                  <span className="absolute -top-1 -right-1 text-xs bg-primary text-primary-foreground rounded-full px-1">
                    {item.badge}
                  </span>
                )}
              </div>
            ) : (
              <item.icon className="h-5 w-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{item.label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className={cn("px-4 py-3", className)}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left controls */}
        <div className="flex items-center space-x-2">
          {controls
            .find(g => g.group === "main")
            ?.items.map(renderControl)}
        </div>

        {/* Center controls */}
        <div className="flex items-center space-x-2">
          {controls
            .find(g => g.group === "secondary")
            ?.items.map(renderControl)}
        </div>

        {/* Right controls */}
        <div className="flex items-center space-x-2">
          {controls
            .find(g => g.group === "end")
            ?.items.map(renderControl)}
        </div>
      </div>
    </div>
  );
}

export default MeetControls;
