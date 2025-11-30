//app/dashboard/student/livestreams/page.jsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/components/auth/useAuth';
import { useToast } from "@/components/ui/use-toast";
import {
  Calendar,
  Clock,
  Play,
  Users,
  Book,
  Radio,
  Activity,
  Video,
  ExternalLink
} from "lucide-react";

export default function StudentLivestreamsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading } = useAuth('student');
  
  const [streams, setStreams] = useState({
    live: [],
    scheduled: []
  });
  const [activeTab, setActiveTab] = useState('live');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch livestreams
  useEffect(() => {
    const fetchStreams = async () => {
      if (!loading && user?.role === 'student') {
        try {
          const [liveResponse, scheduledResponse] = await Promise.all([
            fetch('/api/livestreams?status=live'),
            fetch('/api/livestreams?status=scheduled')
          ]);

          const [liveData, scheduledData] = await Promise.all([
            liveResponse.json(),
            scheduledResponse.json()
          ]);

          setStreams({
            live: liveData.streams,
            scheduled: scheduledData.streams
          });
        } catch (error) {
          console.error('Error:', error);
          toast({
            title: "Error",
            description: "Failed to load livestreams",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchStreams();
  }, [user?.role, loading]);

  // Join livestream
  const handleJoinStream = async (stream) => {
    try {
      if (stream.type === 'native') {
        router.push(`/dashboard/student/livestreams/${stream._id}`);
      } else {
        // Open external platform in new tab
        //app/dashboard/student/livestreams/page.jsx (continued)

        // For external platforms
        window.open(stream.settings.meetingUrl, '_blank');
      }
    } catch (error) {
      console.error('Error joining stream:', error);
      toast({
        title: "Error",
        description: "Failed to join livestream",
        variant: "destructive"
      });
    }
  };

  // Add stream to calendar
  const addToCalendar = (stream) => {
    const startTime = new Date(stream.scheduledFor);
    const endTime = new Date(startTime.getTime() + (stream.duration * 60000));
    
    const event = {
      title: stream.title,
      description: stream.description,
      start: startTime.toISOString(),
      end: endTime.toISOString(),
      location: stream.type === 'native' ? 'Online Class' : `${stream.settings.platform} Meeting`
    };

    // Generate calendar URL
    const url = new URL('https://www.google.com/calendar/render');
    url.searchParams.append('action', 'TEMPLATE');
    url.searchParams.append('text', event.title);
    url.searchParams.append('details', event.description);
    url.searchParams.append('dates', `${event.start}/${event.end}`);
    url.searchParams.append('location', event.location);

    window.open(url.toString(), '_blank');
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Live Classes</h1>
        <Badge variant="outline" className="px-3 py-1">
          <Radio className="w-4 h-4 mr-2 text-red-500" />
          <span className="flex items-center">
            {streams.live.length} Live Now
            <Activity className="w-3 h-3 ml-2 text-red-500 animate-pulse" />
          </span>
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="live" className="flex items-center">
            <Video className="w-4 h-4 mr-2 text-red-500" />
            Live Now
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Upcoming
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          {streams.live.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <div className="text-center text-muted-foreground">
                  <Video className="w-12 h-12 mb-3 mx-auto opacity-50" />
                  <p>No live classes currently in progress</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {streams.live.map((stream) => (
                <Card key={stream._id} className="hover:bg-secondary/5 transition-colors">
                  <CardHeader>
                    <CardTitle className="line-clamp-1">
                      <div className="flex items-center gap-2">
                        {stream.type === 'native' ? (
                          <Activity className="w-4 h-4 text-red-500 animate-pulse" />
                        ) : (
                          <ExternalLink className="w-4 h-4 text-blue-500" />
                        )}
                        {stream.title}
                      </div>
                    </CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Book className="w-4 h-4 mr-1" />
                      {stream.courseName || 'Open Session'}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {stream.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {stream.statistics?.currentViewers || 0}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {Math.round((new Date() - new Date(stream.startedAt)) / 1000 / 60)}m
                        </div>
                      </div>
                      
                      <Button 
                        variant="secondary"
                        size="sm"
                        onClick={() => handleJoinStream(stream)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Join Stream
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="scheduled">
          {streams.scheduled.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <div className="text-center text-muted-foreground">
                  <Calendar className="w-12 h-12 mb-3 mx-auto opacity-50" />
                  <p>No upcoming classes scheduled</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {streams.scheduled.map((stream) => (
                <Card key={stream._id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{stream.title}</h3>
                          {stream.type !== 'native' && (
                            <Badge variant="outline">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              {stream.settings.platform}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(stream.scheduledFor).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {new Date(stream.scheduledFor).toLocaleTimeString()}
                          </div>
                          <div className="flex items-center">
                            <Book className="w-4 h-4 mr-1" />
                            {stream.courseName || 'Open Session'}
                          </div>
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => addToCalendar(stream)}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Add to Calendar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}