"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/components/auth/useAuth';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { 
  Send,
  MessageSquare,
  Users,
  AlertCircle,
  ThumbsUp,
  Hand
} from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { use } from "react";

export default function StudentLivestreamViewer({ params }) {
  const { streamId } =use(params);
  const { user, loading } = useAuth('student');
  const { toast } = useToast();
  const videoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const chatEndRef = useRef(null);

  const [livestream, setLivestream] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isRaiseHand, setIsRaiseHand] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);

  // Initialize WebRTC
  const initializeWebRTC = useCallback(async () => {
    try {
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          {
            urls: process.env.NEXT_PUBLIC_TURN_SERVER,
            username: process.env.NEXT_PUBLIC_TURN_USERNAME,
            credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL
          }
        ]
      };

      const pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;

      // Set up event handlers
      pc.ontrack = (event) => {
        if (videoRef.current) {
          videoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          // Send ICE candidate to signaling server
          sendIceCandidate(event.candidate);
        }
      };

      // Start signaling process
      await startSignaling();
      setIsConnected(true);

    } catch (error) {
      console.error('WebRTC initialization error:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to the stream",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Send ICE candidate to signaling server
  const sendIceCandidate = async (candidate) => {
    try {
      await fetch(`/api/student/livestreams/${streamId}/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'candidate',
          candidate
        })
      });
    } catch (error) {
      console.error('Error sending ICE candidate:', error);
    }
  };

  // Start signaling process
  const startSignaling = async () => {
    try {
      const response = await fetch(`/api/student/livestreams/${streamId}/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'join'
        })
      });

      if (!response.ok) throw new Error('Failed to start signaling');

      const data = await response.json();
      
      if (data.offer) {
        const pc = peerConnectionRef.current;
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        // Send answer back to server
        await fetch(`/api/student/livestreams/${streamId}/signal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'answer',
            answer
          })
        });
      }
    } catch (error) {
      console.error('Signaling error:', error);
      throw error;
    }
  };

  // Fetch livestream details
  const fetchLivestreamDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/student/livestreams/${streamId}`);
      if (!response.ok) throw new Error('Failed to fetch livestream details');
      
      const data = await response.json();
      setLivestream(data);
    } catch (error) {
      console.error('Error fetching livestream:', error);
      toast({
        title: "Error",
        description: "Failed to load livestream details",
        variant: "destructive"
      });
    }
  }, [streamId, toast]);

  // Join livestream
  const joinLivestream = useCallback(async () => {
    try {
      await fetch(`/api/student/livestreams/${streamId}/join`, {
        method: 'POST'
      });

      // Initialize WebRTC connection
      await initializeWebRTC();

      // Start heartbeat
      startHeartbeat();
      
    } catch (error) {
      console.error('Error joining livestream:', error);
      toast({
        title: "Error",
        description: "Failed to join livestream",
        variant: "destructive"
      });
    }
  }, [streamId, toast, initializeWebRTC]);

  // Heartbeat to maintain connection
  const startHeartbeat = useCallback(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/student/livestreams/${streamId}/heartbeat`, {
          method: 'POST'
        });
        const data = await response.json();
        setViewerCount(data.viewerCount);
      } catch (error) {
        console.error('Heartbeat error:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [streamId]);

  // Chat functions
  const fetchChatMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/student/livestreams/${streamId}/chat`);
      if (!response.ok) throw new Error('Failed to fetch chat messages');

      const data = await response.json();
      setChatMessages(data.messages);
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Error fetching chat:', error);
    }
  }, [streamId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await fetch(`/api/student/livestreams/${streamId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage })
      });

      if (!response.ok) throw new Error('Failed to send message');

      setNewMessage('');
      fetchChatMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  // Raise hand
  const toggleRaiseHand = async () => {
    try {
      const response = await fetch(`/api/student/livestreams/${streamId}/raiseHand`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to toggle raise hand');

      setIsRaiseHand(!isRaiseHand);
    } catch (error) {
      console.error('Error toggling raise hand:', error);
      toast({
        title: "Error",
        description: "Failed to raise hand",
        variant: "destructive"
      });
    }
  };

  // Initial setup
  useEffect(() => {
    if (!loading && user?.role === 'student') {
      fetchLivestreamDetails();
      joinLivestream();

      // Set up chat polling
      const chatInterval = setInterval(fetchChatMessages, 5000);

      return () => {
        clearInterval(chatInterval);
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
        }
      };
    }
  }, [
    user?.role,
    loading,
    fetchLivestreamDetails,
    joinLivestream,
    fetchChatMessages
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== 'student') {
    return null;
  }

  return (
    <div className="p-4 md:p-8">
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main Video Section */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{livestream?.title || 'Loading...'}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>{viewerCount}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full aspect-video"
                />
                {!isConnected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
                    <div className="text-center text-white">
                      <AlertCircle className="mx-auto h-12 w-12 mb-2" />
                      <p>Connecting to stream...</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center space-x-2 mt-4">
                <Button
                  variant={isRaiseHand ? "default" : "outline"}
                  onClick={toggleRaiseHand}
                >
                  <Hand className="h-4 w-4 mr-2" />
                  {isRaiseHand ? 'Lower Hand' : 'Raise Hand'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {livestream?.description && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{livestream.description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Chat Section */}
        <Card className="h-[calc(100vh-8rem)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Live Chat</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-col h-full">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {chatMessages.map((message, index) => (
                    <div key={message._id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>
                            {message.userName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {message.userName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm pl-8">{message.message}</p>
                      {index < chatMessages.length - 1 && (
                        <Separator className="my-2" />
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button type="submit" size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}