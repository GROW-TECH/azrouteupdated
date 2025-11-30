"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Plus, Loader2, PinIcon, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Discussions() {
  const router = useRouter();
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]); // You'll need to fetch this
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    courseId: '',
    type: 'discussion',
    tags: [],
  });

  useEffect(() => {
    fetchDiscussions();
    fetchCourses(); // You'll need to implement this
  }, []);

  const fetchDiscussions = async () => {
    try {
      const res = await fetch('/api/teacher/discussions');
      const data = await res.json();
      setDiscussions(data);
    } catch (error) {
      console.error('Error fetching discussions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/teacher/courses');
      const data = await res.json();
      setCourses(data.courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.courseId) {
      alert('Please select a course');
      return;
    }
    
    try {
      const res = await fetch('/api/teacher/discussions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPost),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create discussion');
      }
      
      const newDiscussion = await res.json();
      setDiscussions(prev => [newDiscussion, ...prev]);
      setNewPost({
        title: '',
        content: '',
        courseId: '',
        type: 'discussion',
        tags: []
      });
    } catch (error) {
      console.error('Error creating discussion:', error);
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Discussions</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Discussion</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Select
                value={newPost.courseId}
                onValueChange={(value) => setNewPost(prev => ({ ...prev, courseId: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course._id} value={course._id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Input
                placeholder="Discussion Title (min 5 characters)"
                value={newPost.title}
                onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                required
                minLength={5}
                maxLength={200}
              />
            </div>
            <div>
              <Textarea
                placeholder="What would you like to discuss? (min 20 characters)"
                value={newPost.content}
                onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                required
                minLength={20}
                rows={4}
              />
            </div>
            <div>
              <Input
                placeholder="Tags (comma separated)"
                onChange={(e) => setNewPost(prev => ({ 
                  ...prev, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                }))}
              />
            </div>
            <Button type="submit">
              <Plus className="h-4 w-4 mr-2" />
              Create Discussion
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {discussions.map((discussion) => (
          <Card key={discussion._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {discussion.isPinned && (
                      <PinIcon className="h-4 w-4 text-yellow-500" />
                    )}
                    <h3 className="text-xl font-semibold">{discussion.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary">{discussion.status}</Badge>
                    {discussion.courseId?.title && (
                      <Badge variant="outline">{discussion.courseId.title}</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">{discussion.content}</p>
                  <div className="flex flex-wrap gap-2">
                    {discussion.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      <span>{discussion.replies?.length || 0} replies</span>
                    </div>
                    <span>{new Date(discussion.lastActivity).toLocaleDateString()}</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => router.push(`/dashboard/teacher/discussions/${discussion._id}`)}
                >
                  View Discussion
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}