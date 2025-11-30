// components/discussion/ThreadList.jsx
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ThumbsUp, MessageCircle, Flag, Pin } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";

export function ThreadList({ view, userType, searchQuery }) {
  const threads = [
    {
      id: 1,
      title: "How to implement authentication in Next.js?",
      author: {
        name: "John Doe",
        avatar: "/avatars/john.jpg",
        role: "student"
      },
      category: "Technical",
      createdAt: "2024-10-29T10:30:00",
      replies: 12,
      likes: 25,
      isPinned: true,
      isAnswered: true,
      status: "active",
      lastActivity: "2024-10-30T08:15:00",
      preview: "I'm trying to implement authentication in my Next.js application..."
    },
    {
      id: 2,
      title: "Best practices for React component architecture",
      author: {
        name: "Sarah Smith",
        avatar: "/avatars/sarah.jpg",
        role: "teacher"
      },
      category: "Discussion",
      createdAt: "2024-10-28T15:45:00",
      replies: 8,
      likes: 18,
      isPinned: false,
      isAnswered: false,
      status: "active",
      lastActivity: "2024-10-29T14:20:00",
      preview: "Let's discuss the best practices for organizing React components..."
    }
  ];

  return (
    <div className="space-y-4">
      {threads.map((thread) => (
        <Card key={thread.id} className="hover:bg-accent/5 transition-colors">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={thread.author.avatar} />
                <AvatarFallback>{thread.author.name[0]}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold hover:text-primary cursor-pointer">
                      {thread.isPinned && (
                        <Pin className="h-4 w-4 inline mr-2 text-primary" />
                      )}
                      {thread.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <span>{thread.author.name}</span>
                      <Badge variant="secondary">{thread.category}</Badge>
                      <span>
                        {new Date(thread.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {userType === 'teacher' && (
                    <Button variant="ghost" size="icon">
                      <Flag className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <p className="mt-2 text-sm text-muted-foreground">
                  {thread.preview}
                </p>

                <div className="flex items-center gap-4 mt-4">
                  <Button variant="ghost" size="sm">
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    {thread.likes}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {thread.replies}
                  </Button>
                  {userType === 'teacher' && (
                    <Button variant="outline" size="sm">
                      Moderate
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}