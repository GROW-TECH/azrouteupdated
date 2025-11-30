//components/livestream/ParticipantList.jsx
"use client";

import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Users,
  Search,
  X,
  MoreVertical,
  Mic,
  MicOff,
  Hand,
  Crown,
  AlertCircle,
  Volume2,
  VolumeX
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ParticipantItem = ({ 
  participant, 
  isHost, 
  onRemove, 
  onPromote,
  onMute,
  onAllowAudio 
}) => {
  const isTeacher = participant.role === 'teacher';
  const isCoHost = participant.role === 'co-host';
  const hasRaisedHand = participant.handRaised;
  const isMuted = participant.isMuted;
  const hasRequestedAudio = participant.audioRequested;

  return (
    <div className={cn(
      'p-3 flex items-center justify-between group hover:bg-secondary/10 rounded-lg',
      hasRaisedHand && 'bg-yellow-500/10'
    )}>
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            {participant.name[0].toUpperCase()}
          </div>
          {(isTeacher || isCoHost) && (
            <Crown className="w-3 h-3 text-yellow-500 absolute -top-1 -right-1" />
          )}
        </div>
        
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {participant.name}
            </span>
            {hasRaisedHand && (
              <Hand className="w-4 h-4 text-yellow-500 animate-pulse" />
            )}
            {isMuted ? (
              <MicOff className="w-3 h-3 text-muted-foreground" />
            ) : (
              <Mic className="w-3 h-3 text-green-500" />
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {isTeacher ? 'Host' : isCoHost ? 'Co-host' : 'Participant'}
          </span>
        </div>
      </div>

      {isHost && !isTeacher && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {hasRequestedAudio && (
              <DropdownMenuItem onClick={() => onAllowAudio(participant.id)}>
                <Volume2 className="h-4 w-4 mr-2" />
                Allow Audio
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onMute(participant.id)}>
              {isMuted ? (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Unmute
                </>
              ) : (
                <>
                  <MicOff className="h-4 w-4 mr-2" />
                  Mute
                </>
              )}
            </DropdownMenuItem>
            {!isCoHost && (
              <DropdownMenuItem onClick={() => onPromote(participant.id)}>
                <Crown className="h-4 w-4 mr-2" />
                Make Co-host
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => onRemove(participant.id)}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export function ParticipantList({ 
  streamId, 
  isHost = false, 
  onClose 
}) {
  const [participants, setParticipants] = useState([]);
  const [filteredParticipants, setFilteredParticipants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch participants
  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const response = await fetch(`/api/livestreams/${streamId}/participants`);
        if (response.ok) {
          const data = await response.json();
          setParticipants(data.participants);
          setFilteredParticipants(data.participants);
        }
      } catch (error) {
        console.error('Error fetching participants:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchParticipants();
  }, [streamId]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    //components/livestream/ParticipantList.jsx (continued)

    const ws = new WebSocket(
        `${protocol}//${window.location.host}/api/livestreams/${streamId}/participants`
      );
  
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'participant-joined':
            setParticipants(prev => [...prev, data.participant]);
            break;
          case 'participant-left':
            setParticipants(prev => prev.filter(p => p.id !== data.participantId));
            break;
          case 'hand-raised':
            setParticipants(prev => prev.map(p => 
              p.id === data.participantId ? { ...p, handRaised: true } : p
            ));
            break;
          case 'hand-lowered':
            setParticipants(prev => prev.map(p => 
              p.id === data.participantId ? { ...p, handRaised: false } : p
            ));
            break;
          case 'audio-requested':
            setParticipants(prev => prev.map(p => 
              p.id === data.participantId ? { ...p, audioRequested: true } : p
            ));
            break;
          case 'mute-changed':
            setParticipants(prev => prev.map(p => 
              p.id === data.participantId ? { ...p, isMuted: data.isMuted } : p
            ));
            break;
        }
      };
  
      return () => ws.close();
    }, [streamId]);
  
    // Search functionality
    useEffect(() => {
      const filtered = participants.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredParticipants(filtered);
    }, [searchQuery, participants]);
  
    // Host actions
    const removeParticipant = async (participantId) => {
      if (!isHost) return;
  
      try {
        const response = await fetch(
          `/api/livestreams/${streamId}/participants/${participantId}`, 
          { method: 'DELETE' }
        );
  
        if (response.ok) {
          setParticipants(prev => prev.filter(p => p.id !== participantId));
        }
      } catch (error) {
        console.error('Error removing participant:', error);
      }
    };
  
    const promoteToCoHost = async (participantId) => {
      if (!isHost) return;
  
      try {
        const response = await fetch(
          `/api/livestreams/${streamId}/participants/${participantId}/promote`,
          { method: 'POST' }
        );
  
        if (response.ok) {
          setParticipants(prev => prev.map(p => 
            p.id === participantId ? { ...p, role: 'co-host' } : p
          ));
        }
      } catch (error) {
        console.error('Error promoting participant:', error);
      }
    };
  
    const toggleMute = async (participantId) => {
      if (!isHost) return;
  
      try {
        const participant = participants.find(p => p.id === participantId);
        const response = await fetch(
          `/api/livestreams/${streamId}/participants/${participantId}/mute`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ muted: !participant.isMuted })
          }
        );
  
        if (response.ok) {
          setParticipants(prev => prev.map(p => 
            p.id === participantId ? { ...p, isMuted: !p.isMuted } : p
          ));
        }
      } catch (error) {
        console.error('Error toggling mute:', error);
      }
    };
  
    const allowAudio = async (participantId) => {
      if (!isHost) return;
  
      try {
        const response = await fetch(
          `/api/livestreams/${streamId}/participants/${participantId}/allow-audio`,
          { method: 'POST' }
        );
  
        if (response.ok) {
          setParticipants(prev => prev.map(p => 
            p.id === participantId ? { ...p, audioRequested: false } : p
          ));
        }
      } catch (error) {
        console.error('Error allowing audio:', error);
      }
    };
  
    // Group participants by role
    const groupedParticipants = {
      hosts: filteredParticipants.filter(p => p.role === 'teacher'),
      coHosts: filteredParticipants.filter(p => p.role === 'co-host'),
      participants: filteredParticipants.filter(
        p => p.role !== 'teacher' && p.role !== 'co-host'
      )
    };
  
    return (
      <div className="w-80 h-full border-l bg-background flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <h3 className="font-semibold">Participants</h3>
            <Badge variant="secondary">
              {participants.length}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
  
        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search participants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
  
        {/* Participants List */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="p-4 space-y-6">
              {/* Hosts */}
              {groupedParticipants.hosts.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Host</h4>
                  {groupedParticipants.hosts.map(participant => (
                    <ParticipantItem
                      key={participant.id}
                      participant={participant}
                      isHost={isHost}
                      onRemove={removeParticipant}
                      onPromote={promoteToCoHost}
                      onMute={toggleMute}
                      onAllowAudio={allowAudio}
                    />
                  ))}
                </div>
              )}
  
              {/* Co-hosts */}
              {groupedParticipants.coHosts.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Co-hosts</h4>
                  {groupedParticipants.coHosts.map(participant => (
                    <ParticipantItem
                      key={participant.id}
                      participant={participant}
                      isHost={isHost}
                      onRemove={removeParticipant}
                      onPromote={promoteToCoHost}
                      onMute={toggleMute}
                      onAllowAudio={allowAudio}
                    />
                  ))}
                </div>
              )}
  
              {/* Regular participants */}
              <div>
                <h4 className="text-sm font-medium mb-2">Participants</h4>
                {groupedParticipants.participants.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No participants yet
                  </p>
                ) : (
                  groupedParticipants.participants.map(participant => (
                    <ParticipantItem
                      key={participant.id}
                      participant={participant}
                      isHost={isHost}
                      onRemove={removeParticipant}
                      onPromote={promoteToCoHost}
                      onMute={toggleMute}
                      onAllowAudio={allowAudio}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    );
  }