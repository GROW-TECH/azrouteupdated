// app/events/[eventId]/page.jsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { format } from 'date-fns';
import { 
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  Ticket,
  CalendarClock,
  Building,
  Globe,
} from 'lucide-react';
import { use } from 'react';

export default function EventDetail({ params }) {
  const router = useRouter();
  const { toast } = useToast();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const {eventId}=use(params)

  useEffect(() => {
    fetchEventData();
  }, []);

  const fetchEventData = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch event data');
      }
      const data = await response.json();
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast({
        title: "Error",
        description: "Failed to load event data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setRegistering(true);
    try {
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      toast({
        title: "Success",
        description: "Successfully registered for the event"
      });
      
      // Refresh event data to update available slots
      fetchEventData();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <Alert variant="destructive">
          <AlertDescription>Event not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isRegistrationOpen = new Date() < new Date(event.registrationDeadline);
  const hasAvailableSlots = event.ticketTiers.some(tier => tier.availableCount > 0);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center space-x-4 mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/events')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
      </div>

      {/* Event Header */}
      <div className="mb-8">
        <div className="relative h-64 rounded-lg overflow-hidden mb-6">
          <img
            src={event.thumbnail}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
            {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
          </span>
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
            {event.category}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>About This Event</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{event.description}</p>
            </CardContent>
          </Card>

          {/* Agenda */}
          <Card>
            <CardHeader>
              <CardTitle>Event Agenda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {event.agenda.map((item, index) => (
                  <div key={index} className="border-l-2 border-primary pl-4">
                    <div className="flex items-start">
                      <Clock className="h-5 w-5 mr-2 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{item.time}</p>
                        <h3 className="font-semibold mt-1">{item.title}</h3>
                        <p className="text-muted-foreground mt-1">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Speakers */}
          <Card>
            <CardHeader>
              <CardTitle>Speakers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {event.speakers.map((speaker, index) => (
                  <div key={index} className="flex space-x-4">
                    <img
                      src={speaker.avatar || '/api/placeholder/100/100'}
                      alt={speaker.name}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold">{speaker.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {speaker.designation} at {speaker.company}
                      </p>
                      <p className="mt-2 text-sm">{speaker.bio}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Prerequisites */}
          {event.prerequisites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Prerequisites</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  {event.prerequisites.map((prerequisite, index) => (
                    <li key={index}>{prerequisite}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Event Details */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Date and Time</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.startDate), 'PPP')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.startDate), 'p')} - 
                      {format(new Date(event.endDate), 'p')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {event.timeZone}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  {event.location.type === 'online' ? (
                    <Video className="h-5 w-5 mt-1 text-muted-foreground" />
                  ) : (
                    <MapPin className="h-5 w-5 mt-1 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">Location</p>
                    {event.location.type === 'online' ? (
                      <p className="text-sm text-muted-foreground">
                        Online Event via {event.location.meetingPlatform}
                      </p>
                    ) : (
                      <div>
                        <p className="text-sm">{event.location.venue}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.location.address}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {event.location.city}, {event.location.country}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CalendarClock className="h-5 w-5 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Registration Deadline</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.registrationDeadline), 'PPP p')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ticket Information */}
          <Card>
            <CardHeader>
              <CardTitle>Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {event.ticketTiers.map((tier, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{tier.name}</h3>
                        <p className="text-2xl font-bold mt-1">
                          ${tier.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {tier.availableCount} spots left
                        </p>
                      </div>
                    </div>
                    <ul className="mt-3 space-y-2">
                      {tier.benefits.map((benefit, i) => (
                        <li key={i} className="text-sm flex items-center">
                          <span className="mr-2">•</span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <Button
                className="w-full mt-4"
                disabled={!isRegistrationOpen || !hasAvailableSlots || registering}
                onClick={handleRegister}
              >
                {registering ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Registering...
                  </>
                ) : !isRegistrationOpen ? (
                  'Registration Closed'
                ) : !hasAvailableSlots ? (
                  'Sold Out'
                ) : (
                  'Register Now'
                )}
              </Button>

              {event.isRefundable && (
                <p className="text-sm text-muted-foreground mt-4">
                  <strong>Refund Policy:</strong> {event.refundPolicy}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {event.certificateProvided && (
                  <div className="flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm">Certificate of completion provided</p>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm">
                    Maximum {event.maximumRegistrations} attendees
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}