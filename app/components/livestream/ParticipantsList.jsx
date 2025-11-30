// components/livestream/ParticipantsList.js
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  MoreVertical,
  Hand,
  MessageSquare,
  Volume2,
  VolumeX,
  Ban
} from "lucide-react";
import { format } from "date-fns";

const ParticipantCard = ({ 
  participant, 
  isTeacher, 
  onMute, 
  onRemove,
  onMessageUser 
}) => {
  return (
    <div className="flex items-center justify-between p-2 hover:bg-secondary/5 rounded-lg group">
      <div className="flex items-center space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={participant.avatar} />
          <AvatarFallback>{participant.name[0]}</AvatarFallback>
        </Avatar>
        
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm">{participant.name}</span>
            {participant.raisedHand && (
              <Badge variant="secondary" className="h-5">
                <Hand className="w-3 h-3 mr-1" /> Hand Raised
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            {/* <span>Joined {format(new Date(participant.joinedAt), 'HH:mm')}</span> */}
            {participant.joinedAt}
            {participant.isMuted && (
              <Badge variant="destructive" className="h-4">Muted</Badge>
            )}
          </div>
        </div>
      </div>

      {isTeacher && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onMessageUser(participant._id)}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Message
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMute(participant._id)}>
              {participant.isMuted ? (
                <>
                  <Volume2 className="w-4 h-4 mr-2" />
                  Unmute
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 mr-2" />
                  Mute
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onRemove(participant._id)}
              className="text-destructive"
            >
              <Ban className="w-4 h-4 mr-2" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default function ParticipantsList({
  streamId,
  isTeacher = false,
  className = ""
}) {
  const [participants, setParticipants] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    handsRaised: 0
  });

  // Fetch participants
  const fetchParticipants = async () => {
    try {
      const response = await fetch(`/api/${isTeacher ? 'teacher' : 'student'}/livestreams/${streamId}/participants`);
      if (!response.ok) throw new Error('Failed to fetch participants');
      
      const data = await response.json();
      
      setParticipants(data.participants);
      setStats({
        total: data.participants.length,
        active: data.participants.filter(p => p.isActive).length,
        handsRaised: data.participants.filter(p => p.raisedHand).length
      });
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  // Teacher actions
  const handleMuteParticipant = async (participantId) => {
    if (!isTeacher) return;

    try {
      await fetch(`/api/teacher/livestreams/${streamId}/participants/${participantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'mute'
        })
      });

      fetchParticipants();
    } catch (error) {
      console.error('Error muting participant:', error);
    }
  };

  const handleRemoveParticipant = async (participantId) => {
    if (!isTeacher) return;

    try {
      await fetch(`/api/teacher/livestreams/${streamId}/participants/${participantId}`, {
        method: 'DELETE'
      });

      fetchParticipants();
    } catch (error) {
      console.error('Error removing participant:', error);
    }
  };

  const handleMessageUser = async (participantId) => {
    // This could open a direct message dialog or highlight the user in chat
    console.log('Message user:', participantId);
  };

  // Poll for participant updates
  useEffect(() => {
    fetchParticipants();
    const interval = setInterval(fetchParticipants, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [streamId]);

  return (
    <Card className={className}>
      <CardHeader className="px-4 py-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Participants</CardTitle>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-sm">{stats.total}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>{stats.active} active</span>
            </div>
            {stats.handsRaised > 0 && (
              <div className="flex items-center space-x-1">
                <Hand className="h-4 w-4" />
                <span>{stats.handsRaised} raised</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-20rem)] px-4">
          {/* Hands raised section */}
          {stats.handsRaised > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">Hands Raised</h4>
              <div className="space-y-2">
                {participants
                  .filter(p => p.raisedHand)
                  .map(participant => (
                    <ParticipantCard
                      key={participant._id}
                      participant={participant}
                      isTeacher={isTeacher}
                      onMute={handleMuteParticipant}
                      onRemove={handleRemoveParticipant}
                      onMessageUser={handleMessageUser}
                    />
                  ))
                }
              </div>
            </div>
          )}

          {/* Active participants */}
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">Active</h4>
            <div className="space-y-2">
              {participants
                .filter(p => p.isActive && !p.raisedHand)
                .map(participant => (
                  <ParticipantCard
                    key={participant._id}
                    participant={participant}
                    isTeacher={isTeacher}
                    onMute={handleMuteParticipant}
                    onRemove={handleRemoveParticipant}
                    onMessageUser={handleMessageUser}
                  />
                ))
              }
            </div>
          </div>

          {/* Inactive participants */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">Inactive</h4>
            <div className="space-y-2">
              {participants
                .filter(p => !p.isActive && !p.raisedHand)
                .map(participant => (
                  <ParticipantCard
                    key={participant._id}
                    participant={participant}
                    isTeacher={isTeacher}
                    onMute={handleMuteParticipant}
                    onRemove={handleRemoveParticipant}
                    onMessageUser={handleMessageUser}
                  />
                ))
              }
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}