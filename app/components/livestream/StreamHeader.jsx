import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Clock, Users, Copy, CheckCircle } from "lucide-react";
import { useState } from "react";

export function StreamHeader({ title, isLive, viewerCount, duration, streamKey }) {
  const [copied, setCopied] = useState(false);

  // Format duration from seconds to HH:MM:SS
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    const pad = (num) => num.toString().padStart(2, '0');
    
    return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
  };

  const copyStreamKey = async () => {
    try {
      await navigator.clipboard.writeText(streamKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy stream key:", error);
    }
  };

  return (
    <div className="h-16 border-b bg-background flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {/* Stream Title */}
        <h1 className="text-lg font-semibold">{title}</h1>

        {/* Live Status */}
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-muted'}`} />
          <span className="text-sm font-medium">{isLive ? 'LIVE' : 'Offline'}</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Stream Duration */}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{formatDuration(duration)}</span>
        </div>

        {/* Viewer Count */}
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{viewerCount}</span>
        </div>

        {/* Stream Key */}
        {streamKey && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={copyStreamKey}
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="font-mono">
                    {streamKey.slice(0, 8)}...
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {copied ? 'Copied!' : 'Copy stream key'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}