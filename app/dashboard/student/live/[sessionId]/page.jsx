// app/live/[sessionId]/page.jsx
"use client";
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

export default function JoinSession() {
  const { sessionId } = useParams();
  const [connected, setConnected] = useState(false);
  const videoRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/${sessionId}`);
    
    ws.onopen = () => {
      setConnected(true);
      toast({
        title: "Connected",
        description: "You've joined the live session"
      });
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'stream') {
        try {
          const remoteStream = new MediaStream();
          remoteStream.addTrack(data.track);
          videoRef.current.srcObject = remoteStream;
        } catch (error) {
          console.error('Error setting remote stream:', error);
        }
      }
    };

    ws.onerror = (error) => {
      toast({
        title: "Connection Error",
        description: "Failed to join the session",
        variant: "destructive"
      });
    };

    ws.onclose = () => {
      setConnected(false);
      toast({
        title: "Disconnected",
        description: "The session has ended"
      });
    };

    return () => {
      ws.close();
    };
  }, [sessionId]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full aspect-video bg-gray-900 rounded-lg shadow-lg"
        />
        {!connected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
            <div className="text-white text-center">
              <p className="text-xl font-semibold">Connecting to session...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}