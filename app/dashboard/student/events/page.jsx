"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Calendar,
  MapPin,
  Clock,
  Users,
  Video,
  Tag,
} from "lucide-react";

export default function StudentEventsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [availableEvents, setAvailableEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const [registeredRes, availableRes] = await Promise.all([
          fetch('/api/student/events/registered'),
          fetch('/api/student/events/available')
        ]);

        const [registeredData, availableData] = await Promise.all([
          registeredRes.json(),
          availableRes.json()
        ]);

        setRegisteredEvents(registeredData.events);
        setAvailableEvents(availableData.events);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

   const categories = [
    // 'Web Development',
    // 'Mobile Development',
    // 'Data Science',
    // 'Machine Learning',
    // 'DevOps',
    // 'Cloud Computing',
    // 'Cybersecurity',
    // 'Blockchain',
    // 'Game Development',
    'Dentistry',
    'Medical',
    'Nursing',
    'Other'
  ];

  const eventTypes = [
    'All',
    'Workshop',
    'Webinar',
    'Conference',
    'Bootcamp',
    'Masterclass'
  ];

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const EventCard = ({ event, isRegistered = false }) => (
    <Card className="h-full">
      <CardHeader>
        <div className="relative">
          <img
            src={event.thumbnail}
            alt={event.title}
            className="w-full h-48 object-cover rounded-md"
          />
          <Badge 
            className="absolute top-2 right-2"
            variant={event.type === 'online' ? 'secondary' : 'default'}
          >
            {event.type === 'online' ? (
              <Video className="h-4 w-4 mr-1" />
            ) : (
              <MapPin className="h-4 w-4 mr-1" />
            )}
            {event.type}
          </Badge>
        </div>
        <CardTitle className="text-lg font-semibold mt-4">{event.title}</CardTitle>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            {formatDate(event.startDate)}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            {event.duration} hours
          </div>
          {event.type === 'physical' && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-2" />
              {event.location.city}, {event.location.country}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>{event.currentRegistrations} registered</span>
            </div>
            <Badge variant="outline">
              <Tag className="h-3 w-3 mr-1" />
              {event.category}
            </Badge>
          </div>
          {event.ticketTiers && event.ticketTiers.length > 0 && (
            <div className="text-sm">
              <span className="font-medium">From </span>
              ${Math.min(...event.ticketTiers.map(tier => tier.price))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        {isRegistered ? (
          <Button 
            className="w-full"
            variant="secondary"
            onClick={() => router.push(`/dashboard/student/events/${event.id}`)}
          >
            View Details
          </Button>
        ) : (
          <Button 
            className="w-full"
            onClick={() => router.push(`/dashboard/student/events/${event.id}/register`)}
          >
            Register Now
          </Button>
        )}
      </CardFooter>
    </Card>
  );

  const filteredAvailableEvents = availableEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || event.category.toLowerCase() === categoryFilter;
    const matchesType = typeFilter === 'all' || event.type.toLowerCase() === typeFilter;
    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Events</h2>
          <p className="text-muted-foreground">
            Discover and join upcoming events
          </p>
        </div>
      </div>

      <Tabs defaultValue="available" className="space-y-6">
        <TabsList>
          <TabsTrigger value="registered">
            <Calendar className="h-4 w-4 mr-2" />
            My Events
          </TabsTrigger>
          <TabsTrigger value="available">
            <Calendar className="h-4 w-4 mr-2" />
            Available Events
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registered" className="space-y-6">
          {registeredEvents?.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Registered Events</h3>
              <p className="text-muted-foreground">
                Browse available events and register for ones that interest you
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {registeredEvents.map((event) => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  isRegistered={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem 
                    key={category.toLowerCase()} 
                    value={category.toLowerCase()}
                  >
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={typeFilter}
              onValueChange={setTypeFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((type) => (
                  <SelectItem 
                    key={type.toLowerCase()} 
                    value={type.toLowerCase()}
                  >
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAvailableEvents.map((event) => (
              <EventCard 
                key={event.id} 
                event={event}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}