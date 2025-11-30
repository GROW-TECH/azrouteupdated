//components/livestream/QuestionManager.jsx
"use client";

import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  HelpCircle,
  Hand,
  Search,
  X,
  CheckCircle,
  Clock,
  ThumbsUp,
  MessageCircle,
  UserPlus,
  MoreVertical,
  Star
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const QuestionItem = ({
  question,
  isHost,
  onAnswer,
  onSpotlight,
  onDelete,
  onUpvote,
  onMarkAnswered
}) => {
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnswer = async () => {
    if (!answer.trim()) return;
    setIsSubmitting(true);
    try {
      await onAnswer(question._id, answer);
      setShowAnswerForm(false);
      setAnswer('');
    } catch (error) {
      console.error('Error answering question:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn(
      'p-4 border rounded-lg mb-4',
      question.isAnswered && 'bg-secondary/10',
      question.isSpotlighted && 'border-primary'
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpvote(question._id)}
              disabled={question.isAnswered}
            >
              <ThumbsUp className={cn(
                'w-4 h-4',
                question.hasUpvoted && 'fill-primary'
              )} />
            </Button>
            <span className="text-sm font-medium">
              {question.upvotes}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-sm">
                {question.userName}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(question.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm">{question.text}</p>
            
            {question.isAnswered && question.answer && (
              <div className="mt-2 pl-4 border-l-2">
                <p className="text-sm text-muted-foreground">
                  {question.answer}
                </p>
                <div className="flex items-center mt-1 space-x-1 text-xs text-muted-foreground">
                  <Crown className="w-3 h-3" />
                  <span>Answered by {question.answeredBy}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {isHost && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!question.isAnswered && (
                <>
                  <DropdownMenuItem onClick={() => setShowAnswerForm(true)}>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Answer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSpotlight(question._id)}>
                    <Star className="w-4 h-4 mr-2" />
                    {question.isSpotlighted ? 'Remove Spotlight' : 'Spotlight'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {!question.isAnswered && (
                <DropdownMenuItem onClick={() => onMarkAnswered(question._id)}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Answered
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => onDelete(question._id)}
              >
                <X className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Answer Form */}
      <Dialog open={showAnswerForm} onOpenChange={setShowAnswerForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Answer Question</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">{question.text}</p>
            </div>
            <Textarea
              placeholder="Type your answer..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAnswerForm(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAnswer}
              disabled={isSubmitting || !answer.trim()}
            >
              Submit Answer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const RaisedHandItem = ({
  participant,
  onAllowAudio,
  onDeny,
  onSpotlight
}) => (
  <div className="p-4 border rounded-lg mb-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
          {participant.name[0].toUpperCase()}
        </div>
        <div>
          <div className="font-medium text-sm">
            {participant.name}
          </div>
          <div className="text-xs text-muted-foreground flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {new Date(participant.raisedAt).toLocaleTimeString()}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onSpotlight(participant.id)}
        >
          <Star className="w-4 h-4 mr-2" />
          Spotlight
        </Button>
        <Button
          size="sm"
          onClick={() => onAllowAudio(participant.id)}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Allow Audio
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDeny(participant.id)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  </div>
);

export function QuestionManager({
  streamId,
  isHost = false,
  onClose
}) {
  const [activeTab, setActiveTab] = useState('questions');
  const [questions, setQuestions] = useState([]);
  const [raisedHands, setRaisedHands] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, unanswered, answered
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [questionsRes, handsRes] = await Promise.all([
          fetch(`/api/livestreams/${streamId}/questions`),
          fetch(`/api/livestreams/${streamId}/raised-hands`)
        ]);

        if (questionsRes.ok) {
          const data = await questionsRes.json();
          setQuestions(data.questions);
        }

        if (handsRes.ok) {
          const data = await handsRes.json();
          setRaisedHands(data.raisedHands);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [streamId]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(
      `${protocol}//${window.location.host}/api/livestreams/${streamId}/questions`
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'new-question':
          setQuestions(prev => [data.question, ...prev]);
          break;
        case 'question-updated':
          setQuestions(prev => prev.map(q => 
            q._id === data.question._id ? data.question : q
          ));
          break;
        case 'question-deleted':
          setQuestions(prev => prev.filter(q => q._id !== data.questionId));
          break;
        case 'hand-raised':
          setRaisedHands(prev => [data.participant, ...prev]);
          break;
        case 'hand-lowered':
          setRaisedHands(prev => prev.filter(p => p.id !== data.participantId));
          break;
      }
    };

    return () => ws.close();
  }, [streamId]);

  // Filter and sort questions
  const filteredQuestions = questions
    .filter(q => {
      if (filter === 'unanswered') return !q.isAnswered;
      if (filter === 'answered') return q.isAnswered;
      return true;
    })
    .filter(q => 
      q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.userName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (a.isSpotlighted && !b.isSpotlighted) return -1;
      if (!a.isSpotlighted && b.isSpotlighted) return 1;
      return b.upvotes - a.upvotes;
    });

  // Question actions
  const handleAnswer = async (questionId, answer) => {
    try {
      const response = await fetch(
        `/api/livestreams/${streamId}/questions/${questionId}/answer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answer })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setQuestions(prev => prev.map(q => 
          q._id === questionId ? data.question : q
        ));
      }
    } catch (error) {
      console.error('Error answering question:', error);
    }
  };

  const handleSpotlight = async (questionId) => {
    try {
      const response = await fetch(
        `/api/livestreams/${streamId}/questions/${questionId}/spotlight`,
        { method: 'POST' }
      );

      if (response.ok) {
        const data = await response.json();
        setQuestions(prev => prev.map(q => ({
          ...q,
          isSpotlighted: q._id === questionId
        })));
      }
    } catch (error) {
      console.error('Error spotlighting question:', error);
    }
  };

  // Raised hands actions
  const handleAllowAudio = async (participantId) => {
    try {
      const response = await fetch(
        `/api/livestreams/${streamId}/participants/${participantId}/allow-audio`,
        { method: 'POST' }
      );

      if (response.ok) {
        setRaisedHands(prev => prev.filter(p => p.id !== participantId));
      }
    } catch (error) {
      console.error('Error allowing audio:', error);
    }
  };

  return (
    <div className="w-80 h-full border-l bg-background flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          <h3 className="font-semibold">Questions</h3>
          {raisedHands.length > 0 && (
            <Badge variant="secondary">
              {raisedHands.length} hands raised
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full border-b rounded-none p-0">
          <TabsTrigger
            value="questions"
            className="flex-1 rounded-none data-[state=active]:bg-background"
          >
            Questions
          </TabsTrigger>
          <TabsTrigger
            value="hands"
            className="flex-1 rounded-none data-[state=active]:bg-background"
          >
            Raised Hands ({raisedHands.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="flex-1 p-4">
          {/* Search and Filter */}
          <div className="space-y-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            //components/livestream/QuestionManager.jsx (continued)

            <div className="flex gap-2">
              {['all', 'unanswered', 'answered'].map((filterType) => (
                <Button
                  key={filterType}
                  variant={filter === filterType ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFilter(filterType)}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Questions List */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No questions yet</p>
              </div>
            ) : (
              filteredQuestions.map((question) => (
                <QuestionItem
                  key={question._id}
                  question={question}
                  isHost={isHost}
                  onAnswer={handleAnswer}
                  onSpotlight={handleSpotlight}
                  onDelete={async (id) => {
                    try {
                      const response = await fetch(
                        `/api/livestreams/${streamId}/questions/${id}`,
                        { method: 'DELETE' }
                      );
                      if (response.ok) {
                        setQuestions(prev => prev.filter(q => q._id !== id));
                      }
                    } catch (error) {
                      console.error('Error deleting question:', error);
                    }
                  }}
                  onUpvote={async (id) => {
                    try {
                      const response = await fetch(
                        `/api/livestreams/${streamId}/questions/${id}/upvote`,
                        { method: 'POST' }
                      );
                      if (response.ok) {
                        const data = await response.json();
                        setQuestions(prev => prev.map(q => 
                          q._id === id ? data.question : q
                        ));
                      }
                    } catch (error) {
                      console.error('Error upvoting question:', error);
                    }
                  }}
                  onMarkAnswered={async (id) => {
                    try {
                      const response = await fetch(
                        `/api/livestreams/${streamId}/questions/${id}/mark-answered`,
                        { method: 'POST' }
                      );
                      if (response.ok) {
                        const data = await response.json();
                        setQuestions(prev => prev.map(q => 
                          q._id === id ? data.question : q
                        ));
                      }
                    } catch (error) {
                      console.error('Error marking question as answered:', error);
                    }
                  }}
                />
              ))
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="hands" className="flex-1 p-4">
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : raisedHands.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Hand className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No raised hands</p>
              </div>
            ) : (
              raisedHands.map((participant) => (
                <RaisedHandItem
                  key={participant.id}
                  participant={participant}
                  onAllowAudio={handleAllowAudio}
                  onDeny={async (id) => {
                    try {
                      const response = await fetch(
                        `/api/livestreams/${streamId}/participants/${id}/lower-hand`,
                        { method: 'POST' }
                      );
                      if (response.ok) {
                        setRaisedHands(prev => prev.filter(p => p.id !== id));
                      }
                    } catch (error) {
                      console.error('Error denying hand raise:', error);
                    }
                  }}
                  onSpotlight={async (id) => {
                    try {
                      const response = await fetch(
                        `/api/livestreams/${streamId}/participants/${id}/spotlight`,
                        { method: 'POST' }
                      );
                      if (response.ok) {
                        // Handle spotlight success
                      }
                    } catch (error) {
                      console.error('Error spotlighting participant:', error);
                    }
                  }}
                />
              ))
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}