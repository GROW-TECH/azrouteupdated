//components/livestream/ChatPanel.jsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  MessageSquare,
  Send,
  Pin,
  MoreVertical,
  X,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const ChatMessage = ({ message, isHost, onPin, onDelete }) => {
  const isSystem = message.type === 'system';
  const isPinned = message.isPinned;

  return (
    <div className={cn(
      'p-2 rounded-lg mb-2',
      isPinned && 'bg-secondary/20 border border-primary/20',
      isSystem && 'bg-muted/20 italic'
    )}>
      {/* Host Actions */}
      {isHost && !isSystem && (
        <div className="float-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onPin(message._id)}>
                <Pin className="h-4 w-4 mr-2" />
                {isPinned ? 'Unpin' : 'Pin'}
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => onDelete(message._id)}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Message Content */}
      <div className="space-y-1">
        {!isSystem && (
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {message.userName}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </div>
        )}
        <p className="text-sm break-words">
          {message.message}
        </p>
      </div>
    </div>
  );
};

export function ChatPanel({ streamId, isHost = false, onClose }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/livestreams/${streamId}/chat`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [streamId]);

  // Set up WebSocket connection for real-time messages
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/livestreams/${streamId}/chat`);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'chat') {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: "Connection Error",
        description: "Chat connection lost. Trying to reconnect...",
        variant: "destructive"
      });
    };

    return () => {
      ws.close();
    };
  }, [streamId]);

  // Auto-scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch(`/api/livestreams/${streamId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage.trim() })
      });

      if (!response.ok) throw new Error('Failed to send message');

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  // Message moderation (host only)
  const pinMessage = async (messageId) => {
    if (!isHost) return;

    try {
      const response = await fetch(`/api/livestreams/${streamId}/chat/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pin' })
      });

      if (response.ok) {
        setMessages(prev => prev.map(msg => 
          msg._id === messageId ? { ...msg, isPinned: !msg.isPinned } : msg
        ));
      }
    } catch (error) {
      console.error('Error pinning message:', error);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!isHost) return;

    try {
      const response = await fetch(`/api/livestreams/${streamId}/chat/${messageId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  return (
    <div className="w-80 h-full border-l bg-background flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="font-semibold">Chat</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage
                key={message._id}
                message={message}
                isHost={isHost}
                onPin={pinMessage}
                onDelete={deleteMessage}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </ScrollArea>

      {/* Message Input */}
      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={isSending}
          />
          <Button type="submit" size="icon" disabled={isSending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}