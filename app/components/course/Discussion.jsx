// components/course/Discussion.jsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  MoreVertical,
  Flag,
  Pin,
  PinOff,
  Plus,
  Search,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  Loader2,
  GraduationCap
} from "lucide-react";

function DiscussionPost({ discussion, onVote, onReply, onPin, isTeacher }) {
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const { toast } = useToast();

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return;

    try {
      setSubmitting(true);
      await onReply(discussion.id, replyContent);
      setReplyContent('');
      setShowReplyForm(false);
      toast({
        title: "Reply posted",
        description: "Your reply has been posted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post reply",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const authorName = discussion.author ? 
    `${discussion.author.firstName} ${discussion.author.lastName}` : 
    'Unknown User';

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <div className="flex flex-col items-center space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onVote(discussion.id, 'up')}
              className={discussion.userVote === 'up' ? 'text-primary' : ''}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {discussion.votes}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onVote(discussion.id, 'down')}
              className={discussion.userVote === 'down' ? 'text-destructive' : ''}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{discussion.title}</h3>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                  <span>{authorName}</span>
                  {discussion.author?.department && (
                    <>
                      <span>•</span>
                      <span>{discussion.author.department}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{new Date(discussion.createdAt).toLocaleDateString()}</span>
                  {discussion.solved && (
                    <>
                      <span>•</span>
                      <span className="text-green-500 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Solved
                      </span>
                    </>
                  )}
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isTeacher && (
                    <>
                      <DropdownMenuItem onClick={() => onPin(discussion.id, !discussion.pinned)}>
                        {discussion.pinned ? (
                          <>
                            <PinOff className="h-4 w-4 mr-2" />
                            Unpin
                          </>
                        ) : (
                          <>
                            <Pin className="h-4 w-4 mr-2" />
                            Pin
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem>
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="prose prose-sm max-w-none mb-4">
              {discussion.content}
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Reply
              </Button>
              {discussion.tags?.map(tag => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>

            {showReplyForm && (
              <div className="mt-4 space-y-4">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write your reply..."
                  rows={3}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowReplyForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitReply}
                    disabled={!replyContent.trim() || submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      'Post Reply'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Replies */}
            <div className="mt-4 space-y-4">
              {discussion.replies?.map((reply) => (
                <div key={reply.id} className="border-l-2 pl-4 py-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {`${reply.author.firstName} ${reply.author.lastName}`}
                        </span>
                        {reply.isTeacherResponse && (
                          <Badge variant="secondary" className="flex items-center">
                            <GraduationCap className="h-3 w-3 mr-1" />
                            Teacher
                          </Badge>
                        )}
                        {reply.author?.department && (
                          <span className="text-sm text-muted-foreground">
                            {reply.author.department}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(reply.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onVote(discussion.id, 'up', reply.id)}
                        className={reply.userVote === 'up' ? 'text-primary' : ''}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span className="ml-1">{reply.votes}</span>
                      </Button>
                    </div>
                  </div>
                  <p className="mt-2">{reply.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


export default function CourseDiscussions({ courseId, isTeacher }) {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({
    title: '',
    content: '',
    type: 'discussion',
    tags: []
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchDiscussions();
  }, [courseId, filter]);

  const fetchDiscussions = async () => {
    try {
      const params = new URLSearchParams({
        filter,
        search,
        courseId
      });

      const response = await fetch(`/api/courses/${courseId}/discussions?${params}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      setDiscussions(data.discussions);
    } catch (error) {
      console.error('Error fetching discussions:', error);
      toast({
        title: "Error",
        description: "Failed to load discussions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }

  const handleCreateDiscussion = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/discussions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDiscussion),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      setDiscussions(prev => [data.discussion, ...prev]);
      setShowNewDiscussion(false);
      setNewDiscussion({
        title: '',
        content: '',
        type: 'discussion',
        tags: []
      });

      toast({
        title: "Success",
        description: "Discussion created successfully",
      });
    } catch (error) {
      console.error('Error creating discussion:', error);
      toast({
        title: "Error",
        description: "Failed to create discussion",
        variant: "destructive"
      });
    }
  };

  const handleVote = async (discussionId, voteType, replyId = null) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/discussions/${discussionId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voteType,
          replyId
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      setDiscussions(prev => 
        prev.map(d => {
          if (d.id === discussionId) {
            if (replyId) {
              return {
                ...d,
                replies: d.replies.map(r => 
                  r.id === replyId 
                    ? { ...r, votes: data.votes, userVote: data.userVote }
                    : r
                )
              };
            }
            return { ...d, votes: data.votes, userVote: data.userVote };
          }
          return d;
        })
      );
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: "Failed to register vote",
        variant: "destructive"
      });
    }
  };

  const handlePin = async (discussionId, pinned) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/discussions/${discussionId}/pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pinned }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      setDiscussions(prev =>
        prev.map(d =>
          d.id === discussionId
            ? { ...d, pinned: data.pinned }
            : d
        )
      );

      toast({
        title: pinned ? "Discussion pinned" : "Discussion unpinned",
        description: pinned 
          ? "The discussion has been pinned to the top" 
          : "The discussion has been unpinned",
      });
    } catch (error) {
      console.error('Error pinning discussion:', error);
      toast({
        title: "Error",
        description: "Failed to update discussion",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Discussions</h2>
          <p className="text-muted-foreground">
            Engage with your fellow learners and instructors
          </p>
        </div>
        <Button onClick={() => setShowNewDiscussion(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Discussion
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search discussions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Discussions</SelectItem>
            <SelectItem value="questions">Questions</SelectItem>
            <SelectItem value="announcements">Announcements</SelectItem>
            <SelectItem value="solved">Solved</SelectItem>
            <SelectItem value="pinned">Pinned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* New Discussion Form */}
      {showNewDiscussion && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Input
              placeholder="Discussion title"
              value={newDiscussion.title}
              onChange={(e) => setNewDiscussion(prev => ({
                ...prev,
                title: e.target.value
              }))}
            />
            <Textarea
              placeholder="Discussion content"
              value={newDiscussion.content}
              onChange={(e) => setNewDiscussion(prev => ({
                ...prev,
                content: e.target.value
              }))}
              rows={4}
            />
            <Select
              value={newDiscussion.type}
              onValueChange={(value) => setNewDiscussion(prev => ({
                ...prev,
                type: value
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Discussion type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="discussion">Discussion</SelectItem>
                <SelectItem value="question">Question</SelectItem>
                {isTeacher && (
                  <SelectItem value="announcement">Announcement</SelectItem>
                )}
              </SelectContent>
            </Select>
            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                onClick={() => setShowNewDiscussion(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateDiscussion}
                disabled={!newDiscussion.title || !newDiscussion.content}
              >
                Create Discussion
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discussions List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        </div>
      ) : discussions.length > 0 ? (
        <div className="space-y-4">
          {/* Pinned Discussions */}
          {discussions.filter(d => d.pinned).map(discussion => (
            <DiscussionPost
              key={discussion.id}
              discussion={discussion}
              onVote={handleVote}
              onPin={handlePin}
              isTeacher={isTeacher}
            />
          ))}
          
          {/* Regular Discussions */}
          {discussions.filter(d => !d.pinned).map(discussion => (
            <DiscussionPost
              key={discussion.id}
              discussion={discussion}
              onVote={handleVote}
              onPin={handlePin}
              isTeacher={isTeacher}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium text-lg mb-2">No discussions yet</h3>
          <p className="text-muted-foreground">
            Start a discussion to engage with your peers and instructors
          </p>
        </div>
      )}
    </div>
  );
  }
}