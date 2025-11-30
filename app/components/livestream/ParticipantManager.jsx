import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  Users,
  Search,
  MoreVertical,
  UserMinus,
  Volume2,
  VolumeX,
  MessageSquare,
  Hand,
  Ban
} from 'lucide-react';

const ParticipantManager = ({ 
  streamId,
  participants,
  onRemoveParticipant,
  onClose 
}) => {
  const [search, setSearch] = useState('');
  const [mutedParticipants, setMutedParticipants] = useState(new Set());
  
  const filteredParticipants = participants.filter(participant => 
    participant.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleMuteParticipant = (participantId) => {
    setMutedParticipants(prev => {
      const updated = new Set(prev);
      if (updated.has(participantId)) {
        updated.delete(participantId);
      } else {
        updated.add(participantId);
      }
      return updated;
    });
  };

  const sendDirectMessage = async (participantId) => {
    try {
      await fetch(`/api/livestreams/${streamId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: participantId,
          type: 'DIRECT',
          content: 'Hello! How can I help you?'
        }),
      });
    } catch (error) {
      console.error('Error sending direct message:', error);
    }
  };

  return (
    <Card className="w-80 h-full border-l rounded-none">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participants ({participants.length})
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Manage stream participants
        </CardDescription>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search participants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-2">
            {filteredParticipants.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground p-4">
                No participants found
              </p>
            ) : (
              filteredParticipants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {participant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {participant.handRaised && (
                        <Hand className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{participant.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {participant.role || 'Viewer'}
                      </p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => toggleMuteParticipant(participant.id)}
                      >
                        {mutedParticipants.has(participant.id) ? (
                          <>
                            <Volume2 className="h-4 w-4 mr-2" />
                            Unmute
                          </>
                        ) : (
                          <>
                            <VolumeX className="h-4 w-4 mr-2" />
                            Mute
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => sendDirectMessage(participant.id)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onRemoveParticipant(participant.id)}
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onRemoveParticipant(participant.id)}
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        Ban
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ParticipantManager;