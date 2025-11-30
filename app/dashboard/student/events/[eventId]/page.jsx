"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  CheckCircle,
  CalendarClock,
  User2,
  BookOpen,
  CreditCard,
  ExternalLink
} from "lucide-react";
import { use } from 'react';

export default function EventDetailsPage({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { eventId } =use(params)
  
  const [event, setEvent] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await fetch(`/api/student/events/${eventId}/details`);
        if (!response.ok) {
          throw new Error('Failed to fetch event details');
        }
        const data = await response.json();
        setEvent(data.event);
        setRegistration(data.registration);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();

    // Check for payment success
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      // Refresh event details to get updated registration status
      fetchEventDetails();
    }
  }, [eventId, searchParams]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button 
          className="mt-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const handleJoinEvent = () => {
    if (event.location.type === 'online') {
      window.open(event.location.meetingLink, '_blank');
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Button 
        variant="ghost" 
        className="mb-6"
        onClick={() => router.push('/dashboard/student/events')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Events
      </Button>

      {searchParams.get('payment') === 'success' && (
        <Alert className="mb-6 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">
            Payment successful! Your registration is confirmed.
          </AlertDescription>
        </Alert>
      )}

      {/* Event Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{event.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {formatDate(event.startDate)}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                {formatTime(event.startDate)}
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                {event.currentRegistrations} registered
              </div>
              {event.location.type === 'online' ? (
                <Badge variant="secondary">
                  <Video className="h-4 w-4 mr-1" />
                  Online Event
                </Badge>
              ) : (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {event.location.venue}, {event.location.city}
                </div>
              )}
            </div>
          </div>

          {registration ? (
            <div className="text-right">
              <Badge variant="success" className="mb-2">
                <CheckCircle className="h-4 w-4 mr-1" />
                Registered
              </Badge>
              {registration.status === 'confirmed' && event.location.type === 'online' && (
                <Button
                  className="ml-4"
                  onClick={handleJoinEvent}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Join Event
                </Button>
              )}
            </div>
          ) : (
            <Button
              onClick={() => router.push(`/dashboard/student/events/${eventId}/register`)}
              disabled={!event.isRegistrationOpen}
            >
              Register Now
              {event.ticketTiers[0].price > 0 && (
                <CreditCard className="h-4 w-4 ml-2" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Event Details */}
        <div className="md:col-span-2">
          <Tabs defaultValue="about" className="space-y-6">
            <TabsList>
              <TabsTrigger value="about">
                <BookOpen className="h-4 w-4 mr-2" />
                About
              </TabsTrigger>
              <TabsTrigger value="agenda">
                <CalendarClock className="h-4 w-4 mr-2" />
                Agenda
              </TabsTrigger>
              <TabsTrigger value="speakers">
                <User2 className="h-4 w-4 mr-2" />
                Speakers
              </TabsTrigger>
            </TabsList>

            <TabsContent value="about">
              <Card>
                <CardContent className="pt-6">
                  <div className="prose prose-sm max-w-none">
                    <p>{event.description}</p>
                    {event.prerequisites && (
                      <>
                        <h3 className="text-lg font-semibold mt-4">Prerequisites</h3>
                        <ul>
                          {event.prerequisites.map((prerequisite, index) => (
                            <li key={index}>{prerequisite}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agenda">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {event.agenda.map((item, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="w-24 flex-shrink-0 text-sm text-muted-foreground">
                          {item.time}
                        </div>
                        <div>
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="speakers">
              <div className="grid gap-6 md:grid-cols-2">
                {event.speakers.map((speaker, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <img 
                          src={speaker.avatar} 
                          alt={speaker.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div>
                          <h4 className="font-medium">{speaker.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {speaker.designation} at {speaker.company}
                          </p>
                          <p className="text-sm mt-2">{speaker.bio}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Registration Status */}
          {registration && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Registration Details</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Ticket Tier</p>
                    <p className="font-medium">{registration.ticketTier.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={registration.status === 'confirmed' ? 'success' : 'warning'}>
                      {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                    </Badge>
                  </div>
                  {event.location.type === 'online' && registration.status === 'confirmed' && (
                    <div>
                      <p className="text-sm text-muted-foreground">Meeting Link</p>
                      <Button 
                        variant="outline" 
                        className="w-full mt-2"
                        onClick={handleJoinEvent}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Join Meeting
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Event Resources */}
          {event.resources && event.resources.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Resources</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {event.resources.map((resource, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.open(resource.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {resource.title}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}