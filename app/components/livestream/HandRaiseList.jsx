import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { X, Hand, Check, Clock } from "lucide-react";

export function HandRaiseList({ raisedHands = [], onAccept, onDeny, onClose }) {
  const [sortBy, setSortBy] = useState("time"); // 'time' or 'name'

  // Sort hands based on current sort criteria
  const sortedHands = [...raisedHands].sort((a, b) => {
    if (sortBy === "time") {
      return new Date(b.raisedAt) - new Date(a.raisedAt);
    }
    return a.participantName.localeCompare(b.participantName);
  });

  // Format time since hand was raised
  const getTimeAgo = (raisedAt) => {
    const seconds = Math.floor((new Date() - new Date(raisedAt)) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <Card className="w-80 h-full bg-background border-l rounded-none flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Hand className="h-5 w-5" />
            <h3 className="font-semibold text-lg">Raised Hands</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Sort Controls */}
        <div className="flex gap-2">
          <Button
            variant={sortBy === "time" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSortBy("time")}
            className="flex-1"
          >
            <Clock className="h-4 w-4 mr-2" />
            Sort by Time
          </Button>
          <Button
            variant={sortBy === "name" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSortBy("name")}
            className="flex-1"
          >
            <span className="mr-2">A-Z</span>
            Sort by Name
          </Button>
        </div>
      </div>

      {/* Hand Raise List */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {sortedHands.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No hands raised at the moment
            </div>
          ) : (
            <div className="space-y-3">
              {sortedHands.map((hand) => (
                <div
                  key={hand.participantId}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {hand.participantName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getTimeAgo(hand.raisedAt)}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-500 hover:text-green-600"
                            onClick={() => onAccept(hand.participantId)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Accept hand raise
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => onDeny(hand.participantId)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Deny hand raise
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}