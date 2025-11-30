//components/livestream/ConnectionStatus.jsx

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Wifi,
  WifiOff,
  AlertCircle,
  Loader2
} from 'lucide-react';

const STATUS_CONFIG = {
  connecting: {
    icon: Loader2,
    text: 'Connecting to stream...',
    bgColor: 'bg-yellow-500/20',
    textColor: 'text-yellow-500',
    animate: true
  },
  connected: {
    icon: Wifi,
    text: 'Connected',
    bgColor: 'bg-green-500/20',
    textColor: 'text-green-500'
  },
  disconnected: {
    icon: WifiOff,
    text: 'Disconnected',
    bgColor: 'bg-red-500/20',
    textColor: 'text-red-500'
  },
  error: {
    icon: AlertCircle,
    text: 'Connection error',
    bgColor: 'bg-red-500/20',
    textColor: 'text-red-500'
  },
  reconnecting: {
    icon: Loader2,
    text: 'Reconnecting...',
    bgColor: 'bg-yellow-500/20',
    textColor: 'text-yellow-500',
    animate: true
  }
};

export function ConnectionStatus({
  status = 'connecting',
  quality,
  message,
  className,
  onRetry
}) {
  const [showRetry, setShowRetry] = useState(false);
  const config = STATUS_CONFIG[status];

  useEffect(() => {
    // Show retry button after 10 seconds of connecting/reconnecting
    if (['connecting', 'reconnecting'].includes(status)) {
      const timer = setTimeout(() => setShowRetry(true), 10000);
      return () => clearTimeout(timer);
    }
    setShowRetry(false);
  }, [status]);

  const StatusIcon = config.icon;

  return (
    <div
      className={cn(
        'fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm',
        className
      )}
    >
      <div className={cn(
        'p-6 rounded-lg flex flex-col items-center text-center space-y-4',
        config.bgColor
      )}>
        <StatusIcon 
          className={cn(
            'w-12 h-12',
            config.textColor,
            config.animate && 'animate-spin'
          )}
        />
        
        <div className="space-y-2">
          <h3 className={cn(
            'text-lg font-semibold',
            config.textColor
          )}>
            {message || config.text}
          </h3>

          {quality && (
            <p className="text-sm text-muted-foreground">
              Connection Quality: {quality}
            </p>
          )}

          {showRetry && onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Retry Connection
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Subcomponent for inline status display
ConnectionStatus.Inline = function InlineConnectionStatus({
  status = 'connected',
  quality,
  className
}) {
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1 rounded-full text-sm',
      config.bgColor,
      config.textColor,
      className
    )}>
      <StatusIcon className={cn(
        'w-4 h-4',
        config.animate && 'animate-spin'
      )} />
      <span>{quality || config.text}</span>
    </div>
  );
};

// Subcomponent for status badge
ConnectionStatus.Badge = function ConnectionStatusBadge({
  status = 'connected',
  className
}) {
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
      config.bgColor,
      config.textColor,
      className
    )}>
      <StatusIcon className={cn(
        'w-3 h-3',
        config.animate && 'animate-spin'
      )} />
      <span>{config.text}</span>
    </div>
  );
};

// Hook for managing connection status
export function useConnectionStatus(initialStatus = 'connecting') {
  const [status, setStatus] = useState(initialStatus);
  const [quality, setQuality] = useState(null);
  const [error, setError] = useState(null);

  const updateStatus = (newStatus, errorMessage = null) => {
    setStatus(newStatus);
    setError(errorMessage);
  };

  const updateQuality = (metrics) => {
    // Calculate connection quality based on metrics
    const quality = calculateConnectionQuality(metrics);
    setQuality(quality);
  };

  return {
    status,
    quality,
    error,
    updateStatus,
    updateQuality,
  };
}

function calculateConnectionQuality(metrics) {
  if (!metrics) return null;

  const { packetLoss, rtt, jitter, bitrate } = metrics;

  // Define thresholds
  const thresholds = {
    excellent: {
      packetLoss: 1,
      rtt: 100,
      jitter: 20,
      bitrate: 2000
    },
    good: {
      packetLoss: 3,
      rtt: 200,
      jitter: 40,
      bitrate: 1000
    },
    fair: {
      packetLoss: 7,
      rtt: 300,
      jitter: 60,
      bitrate: 500
    }
  };

  if (
    packetLoss <= thresholds.excellent.packetLoss &&
    rtt <= thresholds.excellent.rtt &&
    jitter <= thresholds.excellent.jitter &&
    bitrate >= thresholds.excellent.bitrate
  ) {
    return 'excellent';
  }

  if (
    packetLoss <= thresholds.good.packetLoss &&
    rtt <= thresholds.good.rtt &&
    jitter <= thresholds.good.jitter &&
    bitrate >= thresholds.good.bitrate
  ) {
    return 'good';
  }

  if (
    packetLoss <= thresholds.fair.packetLoss &&
    rtt <= thresholds.fair.rtt &&
    jitter <= thresholds.fair.jitter &&
    bitrate >= thresholds.fair.bitrate
  ) {
    return 'fair';
  }

  return 'poor';
}