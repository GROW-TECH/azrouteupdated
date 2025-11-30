//components/livestream/RecordingManager.jsx
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Record,
  StopCircle,
  Download,
  MoreVertical,
  Trash,
  PlaySquare,
  Pause,
  Clock,
  Film,
  AlertCircle,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const RecordingItem = ({
  recording,
  onDelete,
  onDownload
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // Format duration in HH:MM:SS
  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs}:` : ''}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Format file size
  const formatSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">
              Recording {new Date(recording.createdAt).toLocaleDateString()}
            </CardTitle>
            <CardDescription>
              {formatDuration(recording.duration)} • {formatSize(recording.size)}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDownload(recording._id)}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => onDelete(recording._id)}
              >
                <Trash className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <video
          className="w-full rounded-lg"
          src={recording.url}
          controls
          onLoadedMetadata={(e) => setDuration(e.target.duration)}
          onTimeUpdate={(e) => setProgress((e.target.currentTime / e.target.duration) * 100)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        <Progress value={progress} className="mt-2" />
      </CardContent>
      <CardFooter className="flex justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {formatDuration(Math.floor(duration * (progress / 100)))} / {formatDuration(Math.floor(duration))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            const video = e.target.closest('.card').querySelector('video');
            if (video) {
              if (isPlaying) {
                video.pause();
              } else {
                video.play();
              }
            }
          }}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <PlaySquare className="w-4 h-4" />
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export function RecordingManager({
  streamId,
  isRecording = false,
  onStartRecording,
  onStopRecording
}) {
  const { toast } = useToast();
  const [recordings, setRecordings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState(null);

  // Fetch recordings
  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        const response = await fetch(`/api/livestreams/${streamId}/recordings`);
        if (response.ok) {
          const data = await response.json();
          setRecordings(data.recordings);
        }
      } catch (error) {
        console.error('Error fetching recordings:', error);
        toast({
          title: "Error",
          description: "Failed to load recordings",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecordings();
  }, [streamId]);

  // Delete recording
  const handleDelete = async (recordingId) => {
    try {
      const response = await fetch(
        `/api/livestreams/${streamId}/recordings/${recordingId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setRecordings(prev => prev.filter(r => r._id !== recordingId));
        toast({
          title: "Success",
          description: "Recording deleted successfully"
        });
      }
    } catch (error) {
      console.error('Error deleting recording:', error);
      toast({
        title: "Error",
        description: "Failed to delete recording",
        variant: "destructive"
      });
    }
    setShowDeleteDialog(false);
    setSelectedRecording(null);
  };

  // Download recording
  const handleDownload = async (recordingId) => {
    try {
      const response = await fetch(`/api/livestreams/${streamId}/recordings/${recordingId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recording-${recordingId}.webm`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading recording:', error);
      toast({
        title: "Error",
        description: "Failed to download recording",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Recording Controls */}
      <div className="flex items-center justify-between p-4 border rounded-lg bg-secondary/10">
        <div className="flex items-center gap-4">
          {isRecording && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-medium">Recording</span>
            </div>
          )}
          <div className="text-sm text-muted-foreground">
            {recordings.length} recordings
          </div>
        </div>
        <Button
          variant={isRecording ? "destructive" : "secondary"}
          size="sm"
          onClick={isRecording ? onStopRecording : onStartRecording}
        >
          {isRecording ? (
            <>
              <StopCircle className="w-4 h-4 mr-2" />
              Stop Recording
            </>
          ) : (
            <>
              <Record className="w-4 h-4 mr-2" />
              Start Recording
            </>
          )}
        </Button>
      </div>

      {/* Recordings List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recent Recordings</h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : recordings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
            <Film className="w-12 h-12 mb-4 opacity-50" />
            <p>No recordings yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            {recordings.map((recording) => (
              <RecordingItem
                key={recording._id}
                recording={recording}
                onDelete={(id) => {
                  setSelectedRecording(id);
                  setShowDeleteDialog(true);
                }}
                onDownload={handleDownload}
              />
            ))}
          </ScrollArea>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Recording</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <p>Are you sure you want to delete this recording?</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDelete(selectedRecording)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}