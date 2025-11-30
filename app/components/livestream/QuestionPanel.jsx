//components/livestream/QuestionPanel.jsx

import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  HelpCircle,
  MoreVertical,
  Star,
  CheckCircle,
  Pin,
  MessageSquare,
  AlertCircle,
  Send,
  Filter,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/useAuth';

const QuestionItem = ({
  question,
  isHost,
  onAnswer,
  onPin,
  onDelete,
  onMarkAnswered,
  onUpvote
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [answer, setAnswer] = useState('');

  const handleAnswer = async () => {
    if (!answer.trim()) return;
    await onAnswer(answer);
    setAnswer('');
    setIsAnswering(false);
  };

  return (
    <div className={cn(
      'p-4 border rounded-lg mb-4',
      question.isPinned && 'border-primary',
      question.isAnswered && 'bg-muted'
    )}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">
              {question.userName}
            </span>
            <div className="flex gap-1">
              {question.isPinned && (
                <Badge variant="outline">
                  <Pin className="w-3 h-3 mr-1" />
                  Pinned
                </Badge>
              )}
              {question.isAnswered && (
                <Badge variant="secondary">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Answered
                </Badge>
              )}
            </div>
          </div>
          
          <p className={cn(
            "text-sm",
            !isExpanded && 'line-clamp-2'
          )}>
            {question.text}
          </p>
          
          {question.text.length > 150 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-muted-foreground hover:text-primary mt-1"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}

          {question.answer && (
            <div className="mt-4 pl-4 border-l-2">
              <p className="text-sm text-muted-foreground">
                {question.answer}
              </p>
              <div className="flex items-center mt-1 space-x-1 text-xs text-muted-foreground">
                <CheckCircle className="w-3 h-3" />
                <span>Answered by {question.answeredBy}</span>
              </div>
            </div>
          )}

          {isAnswering && (
            <div className="mt-4 space-y-2">
              <Input
                placeholder="Type your answer..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAnswer}
                  disabled={!answer.trim()}
                >
                  Submit Answer
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setAnswer('');
                    setIsAnswering(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onUpvote(question._id)}
            disabled={question.isAnswered}
          >
            <Star className={cn(
              'w-4 h-4',
              question.hasUpvoted && 'fill-primary text-primary'
            )} />
          </Button>
          <span className="text-sm font-medium">
            {question.upvotes}
          </span>
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
                  <DropdownMenuItem onClick={() => setIsAnswering(true)}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Answer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onPin(question._id)}>
                    <Pin className="w-4 h-4 mr-2" />
                    {question.isPinned ? 'Unpin' : 'Pin'}
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem onClick={() => onMarkAnswered(question._id)}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Answered
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(question._id)}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};

export function QuestionPanel({
  streamId,
  isHost = false,
  onClose
}) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [filter, setFilter] = useState('all'); // all, unanswered, answered
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(`/api/livestreams/${streamId}/questions`);
        if (response.ok) {
          const data = await response.json();
          setQuestions(data.questions);
        }
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
    // Set up WebSocket subscription for real-time updates
    const ws = new WebSocket(
      `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/livestreams/${streamId}/questions`
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleQuestionUpdate(data);
    };

    return () => ws.close();
  }, [streamId]);

  const handleQuestionUpdate = (data) => {
    switch (data.type) {
      case 'new':
        setQuestions(prev => [data.question, ...prev]);
        break;
      case 'update':
        setQuestions(prev => prev.map(q => 
          q._id === data.question._id ? data.question : q
        ));
        break;
      case 'delete':
        setQuestions(prev => prev.filter(q => q._id !== data.questionId));
        break;
    }
  };

  // Send question
  const sendQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim() || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch(`/api/livestreams/${streamId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newQuestion.trim() })
      });

      if (!response.ok) throw new Error('Failed to send question');
      
      setNewQuestion('');
    } catch (error) {
      console.error('Error sending question:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Filter questions
  const filteredQuestions = questions.filter(q => {
    if (filter === 'unanswered') return !q.isAnswered;
    if (filter === 'answered') return q.isAnswered;
    return true;
  }).sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.upvotes - a.upvotes;
  });

  return (
    <div className="w-80 h-full border-l bg-background flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          <h3 className="font-semibold">Questions</h3>
          <Badge variant="secondary">
            {questions.length}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Filters */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Button
            variant={filter === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'unanswered' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('unanswered')}
          >
            Unanswered
          </Button>
          <Button
            variant={filter === 'answered' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('answered')}
          >
            Answered
          </Button>
        </div>
      </div>

      {/* Questions List */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
                onAnswer={async (answer) => {
                  try {
                    const response = await fetch(
                      `/api/livestreams/${streamId}/questions/${question._id}/answer`,
                      {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ answer })
                      }
                    );
                    if (!response.ok) throw new Error('Failed to answer question');
                  } catch (error) {
                    console.error('Error answering question:', error);
                  }
                }}
                onPin={async (id) => {
                  try {
                    const response = await fetch(
                      `/api/livestreams/${streamId}/questions/${id}/pin`,
                      { method: 'POST' }
                    );
                    if (!response.ok) throw new Error('Failed to pin question');
                  } catch (error) {
                    console.error('Error pinning question:', error);
                  }
                }}
                onDelete={async (id) => {
                  try {
                    const response = await fetch(
                      `/api/livestreams/${streamId}/questions/${id}`,
                      { method: 'DELETE' }
                    );
                    if (!response.ok) throw new Error('Failed to delete question');
                  } catch (error) {
                    console.error('Error deleting question:', error);
                  }
                }}
                onMarkAnswered={async (id) => {
                  try {
                    const response = await fetch(
                      `/api/livestreams/${streamId}/questions/${id}/mark-answered`,
                      { method: 'POST' }
                    );
                    if (!response.ok) throw new Error('Failed to mark question as answered');
                  } catch (error) {
                    console.error('Error marking question as answered:', error);
                  }
                }}
                onUpvote={async (id) => {
                  try {
                    const response = await fetch(
                      `/api/livestreams/${streamId}/questions/${id}/upvote`,
                      { method: 'POST' }
                    );
                    if (!response.ok) throw new Error('Failed to upvote question');
                  } catch (error) {
                    console.error('Error upvoting question:', error);
                  }
                }}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Question Input */}
      <form onSubmit={sendQuestion} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Ask a question..."
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