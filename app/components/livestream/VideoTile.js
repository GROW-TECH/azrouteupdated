// components/livestream/VideoTile.js
import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, VideoOff, Pin, Volume2 } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '../../components/ui/context-menu';
import  VolumeSlider  from '../../components/ui/volume-slider';

export function VideoTile({
  participant,
  isLarge,
  isSmall,
  isActive,
  className
}) {
  const videoRef = useRef(null);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  const handleVolumeChange = (newVolume) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100;
      setVolume(newVolume);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className={cn(
            "relative rounded-lg overflow-hidden bg-black/95",
            isLarge && "w-full h-full",
            isSmall && "w-full aspect-video",
            !isLarge && !isSmall && "w-full aspect-video",
            isActive && "ring-2 ring-primary",
            className
          )}
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          {/* Video Element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={cn(
              "w-full h-full object-cover",
              isVideoOff && "hidden"
            )}
          />

          {/* Video Off Placeholder */}
          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl font-medium">
                    {participant.name[0]}
                  </span>
                </div>
                <p className="text-sm font-medium">{participant.name}</p>
              </div>
            </div>
          )}

          {/* Overlay Controls */}
          {showControls && (
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity">
              <div className="absolute top-2 left-2 flex items-center space-x-2">
                <Badge variant={isActive ? "default" : "secondary"}>
                  {participant.name}
                </Badge>
                {isMuted && <MicOff className="w-4 h-4 text-red-500" />}
              </div>

              <div className="absolute bottom-2 right-2 flex items-center space-x-2">
                <VolumeSlider
                  value={volume}
                  onChange={handleVolumeChange}
                  onMute={handleMuteToggle}
                  isMuted={isMuted}
                />
                {isPinned && <Pin className="w-4 h-4" />}
              </div>
            </div>
          )}

          {/* Status Indicators */}
          {participant.isScreenSharing && (
            <Badge 
              variant="secondary"
              className="absolute top-2 right-2"
            >
              Sharing Screen
            </Badge>
          )}
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onClick={() => setIsPinned(!isPinned)}>
          <Pin className="w-4 h-4 mr-2" />
          {isPinned ? 'Unpin' : 'Pin'}
        </ContextMenuItem>
        <ContextMenuItem onClick={handleMuteToggle}>
          {isMuted ? (
            <>
              <Volume2 className="w-4 h-4 mr-2" />
              Unmute
            </>
          ) : (
            <>
              <MicOff className="w-4 h-4 mr-2" />
              Mute
            </>
          )}
        </ContextMenuItem>
        <ContextMenuItem>
          <div className="flex items-center w-full">
            <Volume2 className="w-4 h-4 mr-2" />
            Volume
            <VolumeSlider
              value={volume}
              onChange={handleVolumeChange}
              className="ml-2"
            />
          </div>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
