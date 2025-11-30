import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Monitor } from "lucide-react";


export function ScreenSharePicker({ isOpen, onClose, onSelect }) {
  const [sources, setSources] = useState([]);
  const [selectedSourceId, setSelectedSourceId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getDisplayMedia = async () => {
      try {
        // Request screen capture to get available sources
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        
        // Immediately stop the stream since we just want the sources
        stream.getTracks().forEach(track => track.stop());
        
        // Get system sources via getDisplayMedia constraints
        const displaySurfaces = [
          { type: "monitor", icon: Monitor, label: "Entire Screen" },
          { type: "window", icon: Monitor, label: "Application Window" },
          { type: "browser", icon: Monitor, label: "Browser Tab" }
        ];

        setSources(displaySurfaces);
      } catch (error) {
        console.error("Error getting display sources:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      getDisplayMedia();
    }
  }, [isOpen]);

  const handleShare = () => {
    if (selectedSourceId) {
      onSelect(selectedSourceId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Choose what to share</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-[60vh]">
              <div className="grid grid-cols-1 gap-2 p-2">
                {sources.map((source) => {
                  const Icon = source.icon;
                  return (
                    <Button
                      key={source.type}
                      variant={selectedSourceId === source.type ? "secondary" : "outline"}
                      className={`h-auto p-4 flex items-start gap-4 ${
                        selectedSourceId === source.type ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => setSelectedSourceId(source.type)}
                    >
                      <Icon className="h-6 w-6 flex-shrink-0" />
                      <div className="text-left">
                        <div className="font-medium">{source.label}</div>
                        <p className="text-sm text-muted-foreground">
                          Share your {source.type === "monitor" ? "entire screen" : source.type}
                        </p>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleShare}
                disabled={!selectedSourceId}
              >
                Share
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}