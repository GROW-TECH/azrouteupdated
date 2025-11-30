// components/livestream/MeetingInfo.js
import { useState } from 'react';
import { Button } from "../../components/ui/button";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../components/ui/sheet";
import { Input } from "../../components/ui/input";
import {
  Info,
  Copy,
  Video,
  Check,
  Clock,
  Users
} from "lucide-react";
import { useToast } from "../../components/ui/use-toast";

export function MeetingInfo({
  title,
  participants,
  isRecording,
  startTime = new Date(),
  meetingLink
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const duration = formatDuration(new Date() - startTime);

  const copyMeetingLink = async () => {
    try {
      await navigator.clipboard.writeText(meetingLink);
      setCopied(true);
      toast({
        title: "Link copied",
        description: "Meeting link copied to clipboard"
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="w-full h-full px-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        <div className="h-4 w-px bg-white/20" />
        <div className="flex items-center space-x-2 text-sm text-white/70">
          <Clock className="w-4 h-4" />
          <span>{duration}</span>
        </div>
        <div className="h-4 w-px bg-white/20" />
        <div className="flex items-center space-x-2 text-sm text-white/70">
          <Users className="w-4 h-4" />
          <span>{participants.length}</span>
        </div>
        {isRecording && (
          <>
            <div className="h-4 w-px bg-white/20" />
            <div className="flex items-center space-x-2 text-red-500">
              <Video className="w-4 h-4 animate-pulse" />
              <span className="text-sm">Recording</span>
            </div>
          </>
        )}
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
            <Info className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Meeting Details</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Meeting Link</label>
              <div className="flex items-center space-x-2">
                <Input
                  value={meetingLink}
                  readOnly
                  className="bg-secondary/50"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyMeetingLink}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Meeting Info</h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Title</dt>
                  <dd>{title}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Start Time</dt>
                  <dd>{startTime.toLocaleTimeString()}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Duration</dt>
                  <dd>{duration}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Participants</dt>
                  <dd>{participants.length}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Recording</dt>
                  <dd className="flex items-center space-x-1">
                    {isRecording ? (
                      <>
                        <Video className="w-4 h-4 text-red-500" />
                        <span>Recording in progress</span>
                      </>
                    ) : (
                      'Not recording'
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Participants</h3>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {participants.map(participant => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm">{participant.name}</span>
                    {participant.isHost && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        Host
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${padNumber(minutes)}:${padNumber(seconds)}`;
  }
  return `${minutes}:${padNumber(seconds)}`;
}

function padNumber(num) {
  return num.toString().padStart(2, '0');
}
