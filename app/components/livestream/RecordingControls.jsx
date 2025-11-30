// components/livestream/RecordingControls.js
"use client";

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Record,
  StopCircle,
  Trash2,
  Download,
  Play,
  Clock,
  Calendar
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function RecordingControls({ streamId }) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [isPlaybackOpen, setIsPlaybackOpen] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      const stream = document.querySelector('video').srcObject;
      if (!stream) {
        toast({
          title: "Error",
          description: "No video stream available",
          variant: "destructive"
        });
        return;
      }

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const formData = new FormData();
        formData.append('recording', blob);
        formData.append('streamId', streamId);
        formData.append('duration', Math.round(chunksRef.current.length * 1000)); // Duration in ms

        try {
          const response = await fetch('/api/teacher/livestreams/recording', {
            method: 'POST',
            body: formData
          });

          if (!response.ok) throw new Error('Failed to save recording');

          toast({
            title: "Success",
            description: "Recording saved successfully"
          });

          // Refresh recordings list
          fetchRecordings();
        } catch (error) {
          console.error('Error saving recording:', error);
          toast({
            title: "Error",
            description: "Failed to save recording",
            variant: "destructive"
          });
        }

        chunksRef.current = [];
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Record in 1-second chunks
      setIsRecording(true);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Failed to start recording",
        variant: "destructive"
      });
    }
  }, [streamId, toast]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Fetch recordings
  const fetchRecordings = useCallback(async () => {
    try {
      const response = await fetch(`/api/teacher/livestreams/${streamId}/recordings`);
      if (!response.ok) throw new Error('Failed to fetch recordings');

      const data = await response.json();
      setRecordings(data.recordings);
    } catch (error) {
      console.error('Error fetching recordings:', error);
    }
  }, [streamId]);

  // Delete recording
  const deleteRecording = async (recordingId) => {
    try {
      const response = await fetch(
        `/api/teacher/livestreams/${streamId}/recording/${recordingId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete recording');

      toast({
        title: "Success",
        description: "Recording deleted successfully"
      });

      // Refresh recordings list
      fetchRecordings();
    } catch (error) {
      console.error('Error deleting recording:', error);
      toast({
        title: "Error",
        description: "Failed to delete recording",
        variant: "destructive"
      });
    }
  };

  // Play recording
  const playRecording = async (recordingId) => {
    try {
      const response = await fetch(
        `/api/teacher/livestreams/${streamId}/recording/${recordingId}`
      );

      if (!response.ok) throw new Error('Failed to get recording URL');

      const data = await response.json();
      setSelectedRecording(data);
      setIsPlaybackOpen(true);
    } catch (error) {
      console.error('Error playing recording:', error);
      toast({
        title: "Error",
        description: "Failed to play recording",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Recording Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            {isRecording ? (
              <Button 
                variant="destructive"
                onClick={stopRecording}
              >
                <StopCircle className="h-4 w-4 mr-2" />
                Stop Recording
              </Button>
            ) : (
              <Button 
                variant="secondary"
                onClick={startRecording}
              >
                <Record className="h-4 w-4 mr-2" />
                Start Recording
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recordings</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {recordings.map((recording) => (
                <div
                  key={recording._id}
                  className="flex items-center justify-between p-4 bg-secondary/10 rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(recording.createdAt).toLocaleDateString()}
                      </span>
                      <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                      <span className="text-sm">
                        {Math.round(recording.duration / 1000 / 60)}m
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => playRecording(recording._id)}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        window.open(recording.downloadUrl, '_blank');
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Recording</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. The recording will be permanently deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteRecording(recording._id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Playback Dialog */}
      <Dialog 
        open={isPlaybackOpen} 
        onOpenChange={setIsPlaybackOpen}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Recording Playback</DialogTitle>
            <DialogDescription>
              Recorded on {selectedRecording && new Date(selectedRecording.recording.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          {selectedRecording && (
            <div className="aspect-video relative bg-black rounded-lg overflow-hidden">
              <video
                src={selectedRecording.url}
                controls
                className="w-full h-full"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
