// components/livestream/ParticipantsSidebar.js
import { useState } from 'react';
import { ScrollArea } from "../../components/ui/scroll-area";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../../components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../../components/ui/sheet";
import {
  Search,
  Users,
  Mic,
  MicOff,
  Video,
  VideoOff,
  MoreVertical,
  Hand,
  Volume2,
  VolumeX,
  Pin,
  UserMinus
} from "lucide-react";

export function ParticipantsSidebar({
  isOpen,
  onClose,
  participants = [],
  activeSpeaker,
  onParticipantAction,
  isTeacher = false
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'joinTime', 'status'

  const filteredParticipants = participants
    .filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'joinTime') return b.joinTime - a.joinTime;
      if (sortBy === 'status') {
        if (a.isHost) return -1;
        if (b.isHost) return 1;
        return 0;
      }
      return 0;
    });

  const handleAction = (participantId, action) => {
    if (onParticipantAction) {
      onParticipantAction(participantId, action);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[400px] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Participants ({participants.length})</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setSortBy('name')}>
                  Sort by name
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSortBy('joinTime')}>
                  Sort by join time
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSortBy('status')}>
                  Sort by status
                </DropdownMenuItem>
                {isTeacher && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      Mute all participants
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Stop all videos
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </SheetTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search participants"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-10rem)]">
          <div className="p-4 space-y-4">
            {/* Host section */}
            {filteredParticipants
              .filter(p => p.isHost)
              .map(participant => (
                <ParticipantItem
                  key={participant.id}
                  participant={participant}
                  isHost
                  isTeacher={isTeacher}
                  isActiveSpeaker={participant.id === activeSpeaker?.id}
                  onAction={handleAction}
                />
              ))}

            {/* Regular participants */}
            {filteredParticipants
              .filter(p => !p.isHost)
              .map(participant => (
                <ParticipantItem
                  key={participant.id}
                  participant={participant}
                  isTeacher={isTeacher}
                  isActiveSpeaker={participant.id === activeSpeaker?.id}
                  onAction={handleAction}
                />
              ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function ParticipantItem({
  participant,
  isHost,
  isTeacher,
  isActiveSpeaker,
  onAction
}) {
  return (
    <div className={`
      flex items-center justify-between p-2 rounded-lg
      ${isActiveSpeaker ? 'bg-primary/10' : 'hover:bg-secondary/50'}
      transition-colors
    `}>
      <div className="flex items-center space-x-3">
        <Avatar>
          <AvatarImage src={participant.avatar} />
          <AvatarFallback>{participant.name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">{participant.name}</span>
            {isHost && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                Host
              </span>
            )}
            {participant.handRaised && (
              <Hand className="w-4 h-4 text-yellow-500" />
            )}
          </div>
          {participant.email && (
            <span className="text-sm text-muted-foreground">
              {participant.email}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-1">
        {participant.isMuted ? (
          <MicOff className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Mic className="w-4 h-4 text-green-500" />
        )}
        {participant.isVideoOff ? (
          <VideoOff className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Video className="w-4 h-4 text-green-500" />
        )}

        {isTeacher && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onAction(participant.id, 'mute')}
              >
                {participant.isMuted ? (
                  <>
                    <Volume2 className="w-4 h-4 mr-2" />
                    Unmute participant
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 mr-2" />
                    Mute participant
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction(participant.id, 'video')}
              >
                {participant.isVideoOff ? (
                  <>
                    <Video className="w-4 h-4 mr-2" />
                    Ask to start video
                  </>
                ) : (
                  <>
                    <VideoOff className="w-4 h-4 mr-2" />
                    Ask to stop video
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onAction(participant.id, 'pin')}
              >
                <Pin className="w-4 h-4 mr-2" />
                {participant.isPinned ? 'Unpin' : 'Pin'} participant
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onAction(participant.id, 'remove')}
                className="text-red-500"
              >
                <UserMinus className="w-4 h-4 mr-2" />
                Remove from meeting
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

// Helper components for participant status badges
function ParticipantStatus({ participant }) {
  const statuses = [];

  if (participant.isHost) {
    statuses.push({
      label: 'Host',
      className: 'bg-primary/10 text-primary'
    });
  }

  if (participant.handRaised) {
    statuses.push({
      label: 'Hand Raised',
      className: 'bg-yellow-500/10 text-yellow-500',
      icon: Hand
    });
  }

  if (participant.isScreenSharing) {
    statuses.push({
      label: 'Sharing Screen',
      className: 'bg-blue-500/10 text-blue-500'
    });
  }

  if (participant.isPresenting) {
    statuses.push({
      label: 'Presenting',
      className: 'bg-green-500/10 text-green-500'
    });
  }

  return (
    <div className="flex flex-wrap gap-1">
      {statuses.map(({ label, className, icon: Icon }) => (
        <span
          key={label}
          className={`
            text-xs px-2 py-0.5 rounded-full flex items-center gap-1
            ${className}
          `}
        >
          {Icon && <Icon className="w-3 h-3" />}
          {label}
        </span>
      ))}
    </div>
  );
}

// Helper component for connection quality indicator
function ConnectionQuality({ quality }) {
  const levels = {
    good: { color: 'text-green-500', bars: 3 },
    fair: { color: 'text-yellow-500', bars: 2 },
    poor: { color: 'text-red-500', bars: 1 }
  };

  const { color, bars } = levels[quality] || levels.good;

  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className={`
            w-1 rounded-sm
            ${i < bars ? color : 'bg-gray-200'}
            ${i === 0 ? 'h-1' : i === 1 ? 'h-2' : 'h-3'}
          `}
        />
      ))}
    </div>
  );
}
