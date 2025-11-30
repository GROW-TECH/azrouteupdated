// app/dashboard/student/discussions/page.jsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, MessageCircle, Share2, Search } from "lucide-react";

export default function DiscussionsPage() {
  const discussions = [
    {
      id: 1,
      author: "Alex Chen",
      avatar: "/avatars/alex.jpg",
      course: "Dental Anatomy",
      timestamp: "2 hours ago",
      content: "Can someone explain the difference between premolars and molars in terms of their root structure?",
      likes: 12,
      comments: 5,
      tags: ["anatomy", "dentistry"]
    },
    {
      id: 2,
      author: "Sarah Johnson",
      avatar: "/avatars/sarah.jpg",
      course: "Clinical Procedures",
      timestamp: "5 hours ago",
      content: "Here's a helpful diagram I found showing the proper sterilization procedure for dental instruments.",
      likes: 24,
      comments: 8,
      tags: ["clinical", "sterilization"]
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Discussions</h1>
          <p className="text-muted-foreground">Engage with your peers and instructors</p>
        </div>
        <Button className="bg-[#3b82f6] hover:bg-[#2563eb]">
          New Discussion
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search discussions..." className="pl-10" />
        </div>
        <Button variant="outline">Recent</Button>
        <Button variant="outline">Popular</Button>
      </div>

      <div className="space-y-4">
        {discussions.map((discussion) => (
          <Card key={discussion.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={discussion.avatar} />
                  <AvatarFallback>{discussion.author[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold">{discussion.author}</span>
                        <span className="text-muted-foreground text-sm"> · {discussion.timestamp}</span>
                      </div>
                      <Badge variant="secondary">{discussion.course}</Badge>
                    </div>
                    <p className="mt-2">{discussion.content}</p>
                  </div>

                  <div className="flex gap-2">
                    {discussion.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-6 pt-2">
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      {discussion.likes}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {discussion.comments}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}