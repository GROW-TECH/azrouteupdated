import React, { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX } from 'lucide-react';

const VolumeSlider = () => {
  const [volume, setVolume] = useState(50);

  const handleVolumeChange = (value) => {
    setVolume(value[0]);
  };

  return (
    <div className="flex items-center gap-4 w-full max-w-xs">
      <button 
        onClick={() => setVolume(volume === 0 ? 50 : 0)}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        {volume === 0 ? (
          <VolumeX className="h-5 w-5 text-gray-600" />
        ) : (
          <Volume2 className="h-5 w-5 text-gray-600" />
        )}
      </button>
      
      <Slider
        value={[volume]}
        onValueChange={handleVolumeChange}
        max={100}
        step={1}
        className="flex-1"
      />
      
      <span className="min-w-[40px] text-sm text-gray-600">
        {volume}%
      </span>
    </div>
  );
};

export default VolumeSlider;