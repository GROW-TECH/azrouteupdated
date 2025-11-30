// components/livestream/StreamGridLayout.js
"use client";

import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { VideoTile } from "./VideoTile";

export function StreamGridLayout({
  participants,
  layout = 'grid',
  activeSpeaker,
  isScreenSharing,
  className
}) {
  const [gridLayout, setGridLayout] = useState('1x1');

  // Calculate grid layout based on participant count
  useEffect(() => {
    const count = participants.length;
    if (count <= 1) setGridLayout('1x1');
    else if (count <= 2) setGridLayout('1x2');
    else if (count <= 4) setGridLayout('2x2');
    else if (count <= 6) setGridLayout('2x3');
    else if (count <= 9) setGridLayout('3x3');
    else if (count <= 12) setGridLayout('3x4');
    else setGridLayout('4x4');
  }, [participants.length]);

  // Grid layout styles
  const gridStyles = {
    '1x1': 'grid-cols-1',
    '1x2': 'grid-cols-2',
    '2x2': 'grid-cols-2',
    '2x3': 'grid-cols-3',
    '3x3': 'grid-cols-3',
    '3x4': 'grid-cols-4',
    '4x4': 'grid-cols-4'
  };

  const renderSpotlightLayout = () => (
    <div className="grid grid-cols-4 h-full gap-2">
      <div className="col-span-3 h-full">
        <VideoTile
          participant={activeSpeaker}
          isLarge={true}
          className="h-full"
        />
      </div>
      <div className="space-y-2 overflow-y-auto">
        {participants
          .filter(p => p.id !== activeSpeaker?.id)
          .map(participant => (
            <VideoTile
              key={participant.id}
              participant={participant}
              isSmall={true}
            />
          ))}
      </div>
    </div>
  );

  const renderPresentationLayout = () => (
    <div className="grid grid-cols-4 h-full gap-2">
      <div className="col-span-3 h-full">
        <div className="h-full bg-black rounded-lg overflow-hidden">
          {/* Screen share content */}
          <video
            id="screen-share"
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />
        </div>
      </div>
      <div className="space-y-2 overflow-y-auto">
        {participants.map(participant => (
          <VideoTile
            key={participant.id}
            participant={participant}
            isSmall={true}
          />
        ))}
      </div>
    </div>
  );

  const renderGridLayout = () => (
    <div
      className={cn(
        "grid gap-2 h-full",
        gridStyles[gridLayout],
        gridLayout === '1x1' && 'place-items-center'
      )}
    >
      {participants.map(participant => (
        <VideoTile
          key={participant.id}
          participant={participant}
          isActive={participant.id === activeSpeaker?.id}/>
        ))}
      </div>
    );
  
    return (
      <div className={cn("w-full h-full p-4", className)}>
        {layout === 'spotlight' && renderSpotlightLayout()}
        {layout === 'presentation' && renderPresentationLayout()}
        {layout === 'grid' && renderGridLayout()}
      </div>
    );
  }
  
