//components/livestream/HandRaiseButton.jsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Hand,
  HandMetal
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function HandRaiseButton({
  streamId,
  isRaised = false,
  disabled = false,
  onToggle,
  size = "default",
  variant = "outline",
  className
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = async () => {
    if (disabled) return;
    
    try {
      setIsAnimating(true);
      await onToggle?.(!isRaised);
    } catch (error) {
      console.error('Error toggling hand:', error);
    } finally {
      // Keep animation for a minimum time for better UX
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const HandIcon = isRaised ? HandMetal : Hand;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled}
          onClick={handleClick}
          className={cn(
            isRaised && 'bg-primary text-primary-foreground hover:bg-primary/90',
            className
          )}
        >
          <HandIcon 
            className={cn(
              'w-4 h-4',
              isAnimating && 'animate-bounce',
              isRaised && !isAnimating && 'animate-pulse'
            )}
          />
          {size === "lg" && (
            <span className="ml-2">
              {isRaised ? 'Lower Hand' : 'Raise Hand'}
            </span>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isRaised ? 'Lower your hand' : 'Raise your hand to ask a question'}
      </TooltipContent>
    </Tooltip>
  );
}

// Badge variant for showing in participant list
HandRaiseButton.Badge = function HandRaiseBadge({
  isRaised = false,
  className
}) {
  const HandIcon = isRaised ? HandMetal : Hand;

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
      isRaised ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
      isRaised && 'animate-pulse',
      className
    )}>
      <HandIcon className="w-3 h-3" />
      <span>
        {isRaised ? 'Hand Raised' : 'Hand Lowered'}
      </span>
    </div>
  );
};

// Hook for managing hand raise state
export function useHandRaise(streamId) {
  const [isRaised, setIsRaised] = useState(false);
  const [raisedAt, setRaisedAt] = useState(null);
  const [acknowledgement, setAcknowledgement] = useState(null);

  const toggleHand = async (raise) => {
    try {
      const response = await fetch(`/api/livestreams/${streamId}/hand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raised: raise })
      });

      if (!response.ok) throw new Error('Failed to toggle hand');

      setIsRaised(raise);
      if (raise) {
        setRaisedAt(new Date());
        setAcknowledgement(null);
      } else {
        setRaisedAt(null);
        setAcknowledgement(null);
      }

      return true;
    } catch (error) {
      console.error('Error toggling hand:', error);
      return false;
    }
  };

  const handleAcknowledgement = (type) => {
    setAcknowledgement({
      type,
      timestamp: new Date()
    });
  };

  return {
    isRaised,
    raisedAt,
    acknowledgement,
    toggleHand,
    handleAcknowledgement,
    waitTime: raisedAt ? Math.round((Date.now() - raisedAt) / 1000) : 0
  };
}

// Priority queue for hand raises (for teacher view)
export class HandRaiseQueue {
  constructor() {
    this.queue = [];
  }

  add(participant) {
    this.queue.push({
      ...participant,
      raisedAt: new Date()
    });
    this.sort();
  }

  remove(participantId) {
    this.queue = this.queue.filter(p => p.id !== participantId);
  }

  acknowledge(participantId, type) {
    const participant = this.queue.find(p => p.id === participantId);
    if (participant) {
      participant.acknowledgement = {
        type,
        timestamp: new Date()
      };
      this.sort();
    }
  }

  sort() {
    this.queue.sort((a, b) => {
      // Unacknowledged first
      if (!a.acknowledgement && b.acknowledgement) return -1;
      if (a.acknowledgement && !b.acknowledgement) return 1;

      // Then by timestamp
      return a.raisedAt - b.raisedAt;
    });
  }

  getNext() {
    return this.queue[0];
  }

  getAll() {
    return [...this.queue];
  }

  clear() {
    this.queue = [];
  }
}