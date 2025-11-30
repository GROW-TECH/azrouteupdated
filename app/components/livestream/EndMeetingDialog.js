// components/livestream/EndMeetingDialog.js
"use client"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
  } from "../../components/ui/dialog";
  import { Button } from "../../components/ui/button";
  import { PhoneOff, Users, Save } from "lucide-react";
  
  export function EndMeetingDialog({
    isOpen,
    onClose,
    onConfirm,
    participantCount = 0,
    isTeacher = false
  }) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-destructive">
              <PhoneOff className="w-5 h-5" />
              <span>{isTeacher ? 'End Meeting for All' : 'Leave Meeting'}</span>
            </DialogTitle>
            <DialogDescription>
              {isTeacher ? (
                <div className="space-y-2">
                  <p>Are you sure you want to end the meeting for all participants?</p>
                  <div className="flex items-center space-x-2 text-sm">
                    <Users className="w-4 h-4" />
                    <span>{participantCount} participant{participantCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              ) : (
                'Are you sure you want to leave the meeting?'
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            {isTeacher && (
              <Button
                variant="secondary"
                onClick={() => {
                  onConfirm('save');
                  onClose();
                }}
              >
                <Save className="w-4 h-4 mr-2" />
                End and Save Recording
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              <PhoneOff className="w-4 h-4 mr-2" />
              {isTeacher ? 'End for All' : 'Leave Meeting'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  
  // components/livestream/RecordingIndicator.js
  export function RecordingIndicator() {
    return (
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full flex items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
        <span className="text-sm font-medium">Recording</span>
      </div>
    );
  }
  
  
  
  
