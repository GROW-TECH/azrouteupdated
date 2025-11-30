// components/livestream/ChatSidebar.js
import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from "../../components/ui/scroll-area";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../../components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "../../components/ui/avatar";
import {
  MessageSquare,
  Send,
  MoreVertical,
  Reply,
  Copy,
  Clock,
  Pin,
  AlertTriangle,
  ThumbsUp
} from "lucide-react";
import { format } from 'date-fns';
import { useToast } from "../../components/ui/use-toast";

export function ChatSidebar({
  isOpen,
  onClose,
  streamId,
  currentUserId,
  isTeacher = false
}) {
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch messages
  useEffect(() => {
    if (isOpen && streamId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, streamId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollToBottom();
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/student/livestreams/${streamId}/chat`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const data = await response.json();
      setMessages(data.messages);
      setPinnedMessages(data.messages.filter(m => m.isPinned));
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await fetch(`/api/student/livestreams/${streamId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newMessage,
          replyTo: replyTo?.id
        })
      });

      if (!response.ok) throw new Error('Failed to send message');

      setNewMessage('');
      setReplyTo(null);
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const handleReply = (message) => {
    setReplyTo(message);
    inputRef.current?.focus();
  };

  const handlePin = async (messageId) => {
    if (!isTeacher) return;

    try {
      const response = await fetch(`/api/teacher/livestreams/${streamId}/chat/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pin' })
      });

      if (!response.ok) throw new Error('Failed to pin message');
      fetchMessages();
    } catch (error) {
      console.error('Error pinning message:', error);
      toast({
        title: "Error",
        description: "Failed to pin message",
        variant: "destructive"
      });
    }
  };

  const copyMessage = async (message) => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast({
        title: "Success",
        description: "Message copied to clipboard"
      });
    } catch (error) {
      console.error('Error copying message:', error);
      toast({
        title: "Error",
        description: "Failed to copy message",
        variant: "destructive"
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[400px] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>Chat</span>
          </SheetTitle>
        </SheetHeader>

        {/* Pinned Messages */}
        {pinnedMessages.length > 0 && (
          <div className="border-b">
            <div className="p-2 bg-secondary/30">
              <h3 className="text-sm font-medium">Pinned Messages</h3>
            </div>
            <ScrollArea className="max-h-32">
              <div className="p-2 space-y-2">
                {pinnedMessages.map(message => (
                  <PinnedMessage
                    key={message.id}
                    message={message}
                    onUnpin={() => handlePin(message.id)}
                    isTeacher={isTeacher}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Messages */}
        <ScrollArea ref={scrollRef} className="h-[calc(100vh-15rem)]">
          <div className="p-4 space-y-4">
            {messages.map(message => (
              <ChatMessage
                key={message.id}
                message={message}
                isOwn={message.userId === currentUserId}
                isTeacher={isTeacher}
                onReply={() => handleReply(message)}
                onPin={() => handlePin(message.id)}
                onCopy={() => copyMessage(message)}
              />
            ))}
          </div>
        </ScrollArea>

        {/* Reply Preview */}
        {replyTo && (
          <div className="p-2 border-t bg-secondary/30 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm">
              <Reply className="w-4 h-4" />
              <span>Replying to {replyTo.userName}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setReplyTo(null)}
            >
              <AlertTriangle className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Message Input */}
        <div className="p-4 border-t">
          <form onSubmit={sendMessage} className="flex items-center space-x-2">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Send a message..."
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ChatMessage({
  message,
  isOwn,
  isTeacher,
  onReply,
  onPin,
  onCopy
}) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`
        max-w-[80%] space-y-1
        ${isOwn ? 'items-end' : 'items-start'}
      `}>
        {/* Message Header */}
        <div className={`flex items-center space-x-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <Avatar className="w-6 h-6">
            <AvatarImage src={message.userAvatar} />
            <AvatarFallback>{message.userName[0]}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{message.userName}</span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.timestamp), 'HH:mm')}
          </span>
        </div>

        {/* Reply Reference */}
        {message.replyTo && (
          <div className={`
            text-xs text-muted-foreground bg-secondary/30 p-2 rounded-lg
            ${isOwn ? 'mr-8' : 'ml-8'}
          `}>
            Replying to {message.replyTo.userName}
          </div>
        )}

        {/* Message Content */}
        <div className={`
          group relative flex items-start space-x-2
          ${isOwn ? 'flex-row-reverse' : 'flex-row'}
        `}>
          <div className={`
            p-3 rounded-lg max-w-sm break-words
            ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-secondary'}
            ${message.isPinned ? 'border-2 border-yellow-500' : ''}
          `}>
            {message.content}
          </div>

          {/* Message Actions */}
          <div className={`
            absolute top-0 ${isOwn ? 'left-0' : 'right-0'} transform ${isOwn ? 'translate-x-[-100%]' : 'translate-x-[100%]'}
            opacity-0 group-hover:opacity-100 transition-opacity
          `}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwn ? 'end' : 'start'}>
                <DropdownMenuItem onClick={onReply}>
                  <Reply className="w-4 h-4 mr-2" />
                  Reply
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onCopy}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </DropdownMenuItem>
                {isTeacher && (
                  <DropdownMenuItem onClick={onPin}>
                    <Pin className="w-4 h-4 mr-2" />
                    {message.isPinned ? 'Unpin' : 'Pin'}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Message Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className={`
            flex items-center gap-1 text-xs
            ${isOwn ? 'justify-end' : 'justify-start'}
          `}>
            {message.reactions.map((reaction, index) => (
              <span
                key={index}
                className="bg-secondary px-2 py-1 rounded-full flex items-center gap-1"
              >
                {reaction.emoji}
                <span>{reaction.count}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PinnedMessage({ message, onUnpin, isTeacher }) {
  return (
    <div className="bg-secondary/20 p-2 rounded-lg text-sm">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-2">
          <Pin className="w-3 h-3 text-yellow-500" />
          <span className="font-medium">{message.userName}</span>
        </div>
        {isTeacher && (
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6"
            onClick={onUnpin}
          >
            <AlertTriangle className="w-3 h-3" />
          </Button>
        )}
      </div>
      <p className="text-muted-foreground line-clamp-2">{message.content}</p>
      <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>{format(new Date(message.timestamp), 'HH:mm')}</span>
        </div>
        {message.reactions?.length > 0 && (
          <div className="flex items-center space-x-1">
            <ThumbsUp className="w-3 h-3" />
            <span>{message.reactions.length}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to format message timestamps
function formatMessageTime(date) {
  const now = new Date();
  const messageDate = new Date(date);
  const diffInHours = Math.abs(now - messageDate) / 36e5;

  if (diffInHours < 24) {
    return format(messageDate, 'HH:mm');
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    return format(messageDate, 'MMM d');
  }
}

// Helper component for message dividers
function MessageDivider({ text }) {
  return (
    <div className="relative py-4">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-secondary" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-background px-2 text-xs text-muted-foreground">
          {text}
        </span>
      </div>
    </div>
  );
}
