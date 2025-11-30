'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  Calendar,
  MapPin,
  Search,
  Video,
  ChevronRight,
  Users,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';

export const CATEGORIES = [
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

const EVENT_TYPES = [
  'All Types',
  'workshop',
  'conference',
  'webinar',
  'bootcamp',
  'masterclass',
  'other'
];

export default function EventsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    category: 'All Categories',
    type: 'All Types',
    timeframe: 'upcoming' // upcoming, past, all
  });

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.category !== 'All Categories') queryParams.append('category', filters.category);
      if (filters.type !== 'All Types') queryParams.append('type', filters.type);
      queryParams.append('timeframe', filters.timeframe);

      const response = await fetch(`/api/events?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatEventTime = (startDate, endDate, timeZone) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start.toDateString() === end.toDateString()) {
      return `${format(start, 'PPP')} · ${format(start, 'p')} - ${format(end, 'p')} (${timeZone})`;
    }
    return `${format(start, 'PPP')} - ${format(end, 'PPP')} (${timeZone})`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Explore Events</h1>
        <p className="text-muted-foreground mt-2">
          Discover workshops, conferences, and more
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div>
          <Input
            placeholder="Search events..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full"
            prefix={<Search className="h-4 w-4 text-muted-foreground" />}
          />
        </div>
        <Select
          value={filters.category}
          onValueChange={(value) => handleFilterChange('category', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.type}
          onValueChange={(value) => handleFilterChange('type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPES.map(type => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.timeframe}
          onValueChange={(value) => handleFilterChange('timeframe', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="upcoming">Upcoming Events</SelectItem>
            <SelectItem value="past">Past Events</SelectItem>
            <SelectItem value="all">All Events</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No events found</h3>
          <p className="text-muted-foreground mt-2">
            Try adjusting your filters to find more events
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event._id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48">
                <img
                  src={event.thumbnail}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                {event.featured && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-sm">
                    Featured
                  </div>
                )}
              </div>
              <CardHeader>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
                    {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                  </span>
                  <span className="text-sm font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
                    {event.category}
                  </span>
                </div>
                <CardTitle className="line-clamp-2">{event.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatEventTime(event.startDate, event.endDate, event.timeZone)}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    {event.location.type === 'online' ? (
                      <>
                        <Video className="h-4 w-4 mr-2" />
                        Online Event
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4 mr-2" />
                        {event.location.city}, {event.location.country}
                      </>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    {event.registrationCount} registered
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <div>
                  {event.ticketTiers.length > 0 && (
                    <p className="text-sm">
                      From ${Math.min(...event.ticketTiers.map(tier => tier.price))}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/events/${event._id}`)}
                >
                  View Details
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}