import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function StreamStats({ stats, onClose }) {
  // Format duration from seconds to HH:MM:SS
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    const pad = (num) => num.toString().padStart(2, '0');
    
    return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
  };

  return (
    <Card className="w-80 h-full bg-background border-l rounded-none overflow-auto">
      <div className="p-4 border-b sticky top-0 bg-background z-10">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Stream Statistics</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="p-4 space-y-6">
        {/* Current Viewers */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Current Viewers
          </h4>
          <p className="text-3xl font-bold">
            {stats.viewers}
          </p>
        </div>

        {/* Peak Viewers */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Peak Viewers
          </h4>
          <p className="text-3xl font-bold">
            {stats.peakViewers}
          </p>
        </div>

        {/* Stream Duration */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Duration
          </h4>
          <p className="text-3xl font-bold">
            {formatDuration(stats.duration)}
          </p>
        </div>

        {/* Chat Messages */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Chat Messages
          </h4>
          <p className="text-3xl font-bold">
            {stats.chatMessages}
          </p>
        </div>

        {/* Questions */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Questions Asked
          </h4>
          <p className="text-3xl font-bold">
            {stats.questions}
          </p>
        </div>
      </div>
    </Card>
  );
}