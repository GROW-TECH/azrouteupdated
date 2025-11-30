// components/livestream/ChatBox.js
"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Send,
  MoreVertical,
  Pin,
  Flag,
  MessageSquare,
  ThumbsUp,
  Users
} from "lucide-react";
import { format } from "date-fns";

const ChatMessage = ({ 
  message, 
  isTeacher, 
  onPin, 
  onDelete, 
  onHighlight,
  currentUserId 
}) => {
  const isOwner = message.userId === currentUserId;
  
  return (
    <div className={`group flex items-start space-x-2 ${message.isHighlighted ? 'bg-secondary/20 p-2 rounded' : ''}`}>
      <Avatar className="h-8 w-8">
        <AvatarImage src={message.userAvatar} />
        <AvatarFallback>{message.userName[0]}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-1">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-sm">
            {message.userName}
            {message.userRole === 'teacher' && (
              <Badge variant="secondary" className="ml-2">Teacher</Badge>
            )}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.timestamp), 'HH:mm')}
          </span>
        </div>
        
        <p className="text-sm">{message.message}</p>
        
        {message.isPinned && (
          <Badge variant="outline" className="mt-1">
            <Pin className="w-3 h-3 mr-1" /> Pinned
          </Badge>
        )}
      </div>
      
      {(isTeacher || isOwner) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isTeacher && (
              <>
                <DropdownMenuItem onClick={() => onPin(message._id)}>
                  <Pin className="w-4 h-4 mr-2" />
                  {message.isPinned ? 'Unpin' : 'Pin'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onHighlight(message._id)}>
                  <Flag className="w-4 h-4 mr-2" />
                  {message.isHighlighted ? 'Remove Highlight' : 'Highlight'}
                </DropdownMenuItem>
              </>
            )}
            {(isTeacher || isOwner) && (
              <DropdownMenuItem
                onClick={() => onDelete(message._id)}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default function ChatBox({ 
  streamId, 
  isTeacher = false,
  currentUserId,
  className = "" 
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const scrollRef = useRef(null);
  const lastMessageRef = useRef(null);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/${isTeacher ? 'teacher' : 'student'}/livestreams/${streamId}/chat`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const data = await response.json();
      setMessages(data.messages);
      setPinnedMessages(data.messages.filter(m => m.isPinned));
      
      // Scroll to bottom on new messages
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await fetch(`/api/${isTeacher ? 'teacher' : 'student'}/livestreams/${streamId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage })
      });

      if (!response.ok) throw new Error('Failed to send message');

      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Message actions (for teachers)
  const handlePinMessage = async (messageId) => {
    if (!isTeacher) return;

    try {
      await fetch(`/api/teacher/livestreams/${streamId}/chat/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'pin'
        })
      });

      fetchMessages();
    } catch (error) {
      console.error('Error pinning message:', error);
    }
  };

  const handleHighlightMessage = async (messageId) => {
    if (!isTeacher) return;

    try {
      await fetch(`/api/teacher/livestreams/${streamId}/chat/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'highlight'
        })
      });

      fetchMessages();
    } catch (error) {
      console.error('Error highlighting message:', error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await fetch(`/api/${isTeacher ? 'teacher' : 'student'}/livestreams/${streamId}/chat/${messageId}`, {
        method: 'DELETE'
      });

      fetchMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // Poll for new messages
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [streamId]);

  return (
    <Card className={className}>
      <CardHeader className="px-4 py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Live Chat</CardTitle>
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-sm">{messages.length}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="flex flex-col h-[calc(100vh-20rem)]">
          {/* Pinned Messages */}
          {pinnedMessages.length > 0 && (
            <div className="px-4 py-2 border-b bg-secondary/5">
              <div className="flex items-center space-x-2 text-sm font-medium mb-2">
                <Pin className="h-4 w-4" />
                <span>Pinned Messages</span>
              </div>
              <ScrollArea className="max-h-24">
                {pinnedMessages.map((message) => (
                  <div key={message._id} className="py-1">
                    <span className="font-medium text-xs">{message.userName}: </span>
                    <span className="text-xs text-muted-foreground">{message.message}</span>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}

          {/* Messages List */}
          <ScrollArea ref={scrollRef} className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <ChatMessage
                  key={message._id}
                  message={message}
                  isTeacher={isTeacher}
                  onPin={handlePinMessage}
                  onDelete={handleDeleteMessage}
                  onHighlight={handleHighlightMessage}
                  currentUserId={currentUserId}
                  ref={index === messages.length - 1 ? lastMessageRef : null}
                />
              ))}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <form onSubmit={sendMessage} className="p-4 border-t">
            <div className="flex items-center space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}