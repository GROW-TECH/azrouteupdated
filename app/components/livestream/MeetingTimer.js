// components/livestream/MeetingTimer.js
import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
  
export function MeetingTimer({ startTime = new Date() }) {
  const [duration, setDuration] = useState('00:00');

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date() - startTime;
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      if (hours > 0) {
        setDuration(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="text-sm text-white/70 flex items-center space-x-1">
      <Clock className="w-4 h-4" />
      <span>{duration}</span>
    </div>
  );
}
