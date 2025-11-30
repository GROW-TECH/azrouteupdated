//app/dashboard/teacher/livestreams/[id]/page.jsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import WebRTCHost from "@/lib/webrtc-host";
import { cn } from "@/lib/utils";

// Import livestream components
import { StreamHeader } from "@/components/livestream/StreamHeader";
import HostControls from "@/components/livestream/HostControls";
import { StreamSettings } from "@/components/livestream/StreamSettings";
import ParticipantManager from "@/components/livestream/ParticipantManager";
import { ChatPanel } from "@/components/livestream/ChatPanel";
import { QuestionManager } from "@/components/livestream/QuestionManager";
import { StreamStats } from "@/components/livestream/StreamStats";
import RecordingIndicator from "@/components/livestream/RecordingIndicator";
import { HandRaiseList } from "@/components/livestream/HandRaiseList";
import { ScreenSharePicker } from "@/components/livestream/ScreenSharePicker";
import { use } from "react";

export default function TeacherLivestreamView({ params }) {
  const router = useRouter();
  const { user, loading } = useAuth("teacher");
  const { toast } = useToast();
  const webrtcRef = useRef(null);
  const { id } = use(params);

  // Stream state
  const [streamDetails, setStreamDetails] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [streamKey, setStreamKey] = useState(null);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showScreenPicker, setShowScreenPicker] = useState(false);

  // Stream data
  const [participants, setParticipants] = useState([]);
  const [raisedHands, setRaisedHands] = useState([]);
  const [streamStats, setStreamStats] = useState({
    viewers: 0,
    peakViewers: 0,
    duration: 0,
    chatMessages: 0,
    questions: 0,
  });

  // Define error handler
  const handleError = useCallback((error) => {
    console.error("WebRTC error:", error);
    toast({
      title: "Error",
      description: error.message || "An unexpected error occurred.",
      variant: "destructive",
    });
  }, [toast]);

  // Connection state handler
  const handleConnectionStateChange = useCallback((state) => {
    console.log("Connection state changed:", state);
  }, []);

  // Initialize stream
  useEffect(() => {
    const initializeStream = async () => {
      if (!user || loading) return;

      try {
        // Fetch stream details
        const response = await fetch(`/api/livestreams/${id}`);
        if (!response.ok) throw new Error("Failed to fetch stream details");
        const details = await response.json();
        setStreamDetails(details);

        // Initialize WebRTC
        webrtcRef.current = new WebRTCHost({
          streamId: id,
          userId: user.id,
          onParticipantJoined: handleParticipantJoined,
          onParticipantLeft: handleParticipantLeft,
          onError: handleError,
          onConnectionStateChange: handleConnectionStateChange,
        });

        await webrtcRef.current.initialize();
        const { streamKey } = await webrtcRef.current?.startStream();
        setStreamKey(streamKey);
        setIsLive(true);

        // Start statistics polling
        startStatsPolling();
      } catch (error) {
        console.error("Stream initialization error:", error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsConnecting(false);
      }
    };

    initializeStream();

    // Cleanup
    return () => {
      if (webrtcRef.current) {
        endStream();
      }
    };
  }, [user, loading, id, handleError, handleConnectionStateChange]);

  // Stats polling
  const startStatsPolling = () => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/livestreams/${id}/stats`);
        if (response.ok) {
          const stats = await response.json();
          setStreamStats(stats);
        }
      } catch (error) {
        console.error("Stats polling error:", error);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  };

  // Participant handlers
  const handleParticipantJoined = useCallback((participant) => {
    setParticipants((prev) => [...prev, participant]);
    toast({
      title: "Participant Joined",
      description: `${participant.name} joined the stream`,
    });
  }, [toast]);

  const handleParticipantLeft = useCallback((participantId) => {
    setParticipants((prev) => prev.filter((p) => p.id !== participantId));
  }, []);

  // Media control handlers
  const toggleCamera = async () => {
    try {
      await webrtcRef.current?.toggleVideo();
      setIsCameraOn(!isCameraOn);
    } catch (error) {
      console.error("Camera toggle error:", error);
      toast({
        title: "Error",
        description: "Failed to toggle camera",
        variant: "destructive",
      });
    }
  };

  const toggleMicrophone = async () => {
    try {
      await webrtcRef.current?.toggleAudio();
      setIsMicOn(!isMicOn);
    } catch (error) {
      console.error("Microphone toggle error:", error);
      toast({
        title: "Error",
        description: "Failed to toggle microphone",
        variant: "destructive",
      });
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        setShowScreenPicker(true);
      } else {
        await webrtcRef.current?.stopScreenShare();
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error("Screen share error:", error);
      toast({
        title: "Error",
        description: "Failed to toggle screen sharing",
        variant: "destructive",
      });
    }
  };

  // Recording handlers
  const toggleRecording = async () => {
    try {
      if (!isRecording) {
        await fetch(`/api/livestreams/${id}/recording/start`, {
          method: "POST",
        });
        setIsRecording(true);
      } else {
        await fetch(`/api/livestreams/${id}/recording/stop`, {
          method: "POST",
        });
        setIsRecording(false);
      }
    } catch (error) {
      console.error("Recording toggle error:", error);
      toast({
        title: "Error",
        description: "Failed to toggle recording",
        variant: "destructive",
      });
    }
  };

  // Stream end handler
  const endStream = async () => {
    try {
      if (webrtcRef.current) {
        webrtcRef.current.disconnect();
      }

      await fetch(`/api/livestreams/${id}/end`, {
        method: "POST",
      });

      router.push("/dashboard/teacher/livestreams");
    } catch (error) {
      console.error("Error ending stream:", error);
      toast({
        title: "Error",
        description: "Failed to end stream properly",
        variant: "destructive",
      });
    }
  };

  // Participant management
  const removeParticipant = async (participantId) => {
    try {
      await fetch(`/api/livestreams/${id}/participants/${participantId}`, {
        method: "DELETE",
      });
      setParticipants((prev) => prev.filter((p) => p.id !== participantId));
    } catch (error) {
      console.error("Error removing participant:", error);
    }
  };

  if (loading || isConnecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-background">
      {/* Stream Header */}
      <StreamHeader
        title={streamDetails?.title}
        isLive={isLive}
        viewerCount={streamStats.viewers}
        duration={streamStats.duration}
        streamKey={streamKey}
      />

      {/* Main Content */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Stream Preview */}
        <div className="flex-1 relative">
          {/* Local Video Preview */}
          <video
            id="local-preview"
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          />

          {/* Screen Share Preview (if active) */}
          {isScreenSharing && (
            <video
              id="screen-share"
              className="absolute top-4 right-4 w-1/4 h-1/4 object-contain bg-black rounded-lg"
              autoPlay
              muted
              playsInline
            />
          )}

          {/* Recording Indicator */}
          {isRecording && <RecordingIndicator />}

          {/* Stream Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <HostControls
              isCameraOn={isCameraOn}
              isMicOn={isMicOn}
              isScreenSharing={isScreenSharing}
              isRecording={isRecording}
              onToggleCamera={toggleCamera}
              onToggleMic={toggleMicrophone}
              onToggleScreenShare={toggleScreenShare}
              onToggleRecording={toggleRecording}
              onToggleChat={() => setShowChat(!showChat)}
              onToggleParticipants={() => setShowParticipants(!showParticipants)}
              onToggleQuestions={() => setShowQuestions(!showQuestions)}
              onToggleStats={() => setShowStats(!showStats)}
              onOpenSettings={() => setShowSettings(true)}
              onEndStream={() => setShowEndDialog(true)}
              raisedHandsCount={raisedHands.length}
            />
          </div>
        </div>

        {/* Side Panels */}
        {showParticipants && (
          <ParticipantManager
            streamId={id}
            participants={participants}
            onRemoveParticipant={removeParticipant}
            onClose={() => setShowParticipants(false)}
          />
        )}

        {showChat && (
          <ChatPanel
            streamId={id}
            isHost={true}
            onClose={() => setShowChat(false)}
          />
        )}

        {showQuestions && (
          <QuestionManager
            streamId={id}
            onClose={() => setShowQuestions(false)}
          />
        )}

        {showStats && (
          <StreamStats
            stats={streamStats}
            onClose={() => setShowStats(false)}
          />
        )}
      </div>

      {/* Modals */}
      <StreamSettings
        isOpen={showSettings}
        streamId={id}
        settings={streamDetails?.settings}
        onClose={() => setShowSettings(false)}
      />

      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Stream?</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to end the stream? This cannot be undone.</p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEndDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={endStream}
            >
              End Stream
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ScreenSharePicker
        isOpen={showScreenPicker}
        onClose={() => setShowScreenPicker(false)}
        onSelect={async (sourceId) => {
          try {
            await webrtcRef.current?.startScreenShare(sourceId);
            setIsScreenSharing(true);
            setShowScreenPicker(false);
          } catch (error) {
            console.error("Screen share error:", error);
            toast({
              title: "Error",
              description: "Failed to start screen sharing",
              variant: "destructive",
            });
          }
        }}
      />
    </div>
  );
}
