"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/useAuth";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import WebRTCClient from "@/lib/webrtc-client";
import { cn } from "@/lib/utils";

// Import livestream components
import { StreamControls } from "@/components/livestream/StreamControls";
import { ChatPanel } from "@/components/livestream/ChatPanel";
import { ParticipantList } from "@/components/livestream/ParticipantList";
import { StreamHeader } from "@/components/livestream/StreamHeader";
import { ConnectionStatus } from "@/components/livestream/ConnectionStatus";
import { HandRaiseButton } from "@/components/livestream/HandRaiseButton";
import { QuestionPanel } from "@/components/livestream/QuestionPanel";
import { use } from "react";

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const NETWORK_MONITOR_INTERVAL = 2000; // 2 seconds

export default function StudentLivestreamView({ params }) {
  const router = useRouter();
  const { user, loading } = useAuth("student");
  const { toast } = useToast();
  const webrtcRef = useRef(null);
  const heartbeatRef = useRef(null);

  // State management
  const [streamDetails, setStreamDetails] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState("good");
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [error, setError] = useState(null);
  const { id } = use(params);

  // Network quality monitoring
  const handleNetworkStats = useCallback((stats) => {
    setConnectionQuality(stats.connection.quality);
  }, []);

  // Initialize stream and join
  useEffect(() => {
    const initializeStream = async () => {
      if (!user || loading) return;

      try {
        // Fetch stream details
        const response = await fetch(`/api/livestreams/${id}`);
        if (!response.ok) throw new Error("Failed to fetch stream details");
        const details = await response.json();
        setStreamDetails(details);

        // Handle external platform streams
        if (details.type !== "native") {
          window.open(details.settings.meetingUrl, "_blank");
          router.push("/dashboard/student/livestreams");
          return;
        }

        // Join the stream
        const joinResponse = await fetch(`/api/livestreams/${id}/join`, {
          method: "POST",
        });
        if (!joinResponse.ok) throw new Error("Failed to join stream");

        const { iceServers, hostId } = await joinResponse.json();

        // Initialize WebRTC with new configuration
        webrtcRef.current = new WebRTCClient({
          streamId: id,
          userId: user.id,
          onConnectionStateChange: handleConnectionStateChange,
          onTrack: handleTrack,
          onError: handleError
        });

        // Initialize only - removed the connect() call since it's handled in initialize()
        await webrtcRef.current.initialize();

        // Start network monitoring
        webrtcRef.current.startNetworkMonitoring(handleNetworkStats, NETWORK_MONITOR_INTERVAL);

        setHasJoined(true);
        startHeartbeat();

      } catch (error) {
        console.error("Stream initialization error:", error);
        setError(error.message);
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
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      if (webrtcRef.current) {
        webrtcRef.current.stopNetworkMonitoring();
        leaveStream();
      }
    };
  }, [user, loading, id]);

  // Connection state handling
  const handleConnectionStateChange = useCallback((state) => {
    setIsConnected(state === "connected");
    if (state === "failed" || state === "disconnected") {
      toast({
        title: "Connection Lost",
        description: "Attempting to reconnect...",
        variant: "destructive",
      });
    }
  }, []);

  // Media track handling
  const handleTrack = useCallback((track, stream) => {
    const videoElement = document.getElementById("stream-video");
    if (videoElement) {
      videoElement.srcObject = stream;
    }
  }, []);

  // Error handling
  const handleError = useCallback((error) => {
    console.error("WebRTC error:", error);
    toast({
      title: "Stream Error",
      description: error.message,
      variant: "destructive",
    });
  }, []);

  // Heartbeat to maintain connection
  const startHeartbeat = () => {
    heartbeatRef.current = setInterval(async () => {
      try {
        await fetch(`/api/livestreams/${id}/heartbeat`, {
          method: "POST",
        });
      } catch (error) {
        console.error("Heartbeat error:", error);
      }
    }, HEARTBEAT_INTERVAL);
  };

  // Leave stream handling
  const leaveStream = async () => {
    try {
      if (webrtcRef.current) {
        webrtcRef.current.disconnect();
      }

      await fetch(`/api/livestreams/${id}/leave`, {
        method: "POST",
      });

      router.push("/dashboard/student/livestreams");
    } catch (error) {
      console.error("Error leaving stream:", error);
    }
  };

  // Hand raise handling with new WebRTC request
  const toggleHandRaise = async () => {
    try {
      if (webrtcRef.current) {
        await webrtcRef.current.requestToSpeak();
      }
      const response = await fetch(`/api/livestreams/${id}/hand`, {
        method: "POST",
      });
      if (response.ok) {
        setHandRaised(!handRaised);
      }
    } catch (error) {
      console.error("Error toggling hand:", error);
    }
  };

  // Audio mute handling with new WebRTC toggle
  const toggleAudio = useCallback(async () => {
    if (webrtcRef.current) {
      const isEnabled = await webrtcRef.current.toggleAudio();
      setIsMuted(!isEnabled);
    }
  }, []);

  if (loading || isConnecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Failed to join stream</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.push("/dashboard/student/livestreams")}>
            Back to Livestreams
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-background">
      {/* Stream Header */}
      <StreamHeader
        title={streamDetails?.title}
        teacher={streamDetails?.teacherName}
        viewerCount={streamDetails?.statistics?.currentViewers}
        connectionQuality={connectionQuality}
      />

      {/* Main Content */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Stream View */}
        <div className="flex-1 relative">
          <video
            id="stream-video"
            className="w-full h-full object-cover"
            autoPlay
            playsInline
          />

          {/* Connection Status Overlay */}
          {!isConnected && (
            <ConnectionStatus status={isConnected ? "connected" : "connecting"} />
          )}

          {/* Stream Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <StreamControls
              isMuted={isMuted}
              onToggleMute={toggleAudio}
              onToggleChat={() => setShowChat(!showChat)}
              onToggleParticipants={() => setShowParticipants(!showParticipants)}
              onToggleQuestions={() => setShowQuestions(!showQuestions)}
              onLeave={() => setShowLeaveDialog(true)}
            >
              <HandRaiseButton
                raised={handRaised}
                onToggle={toggleHandRaise}
              />
            </StreamControls>
          </div>
        </div>

        {/* Side Panels */}
        {showChat && (
          <ChatPanel
            streamId={id}
            onClose={() => setShowChat(false)}
          />
        )}

        {showParticipants && (
          <ParticipantList
            streamId={id}
            onClose={() => setShowParticipants(false)}
          />
        )}

        {showQuestions && (
          <QuestionPanel
            streamId={id}
            onClose={() => setShowQuestions(false)}
          />
        )}
      </div>

      {/* Leave Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Stream?</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to leave the stream?</p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLeaveDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={leaveStream}
            >
              Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}