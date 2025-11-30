'use client';

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  Building,
  Tag,
  GraduationCap
} from "lucide-react";
import { format } from 'date-fns';

export function EventCard({ event, onClick }) {
  const {
    title,
    thumbnail,
    type,
    startDate,
    endDate,
    location,
    registrationCount,
    maximumRegistrations,
    ticketTiers,
    featured,
    category,
    teacher
  } = event;

  // Calculate event metrics
  const isOnline = location.type === 'online';
  const lowestPrice = ticketTiers?.length > 0 
    ? Math.min(...ticketTiers.map(tier => tier.price))
    : null;
  const registrationProgress = (registrationCount / maximumRegistrations) * 100;
  const spotsLeft = maximumRegistrations - registrationCount;
  const isSoldOut = spotsLeft === 0;

  // Format teacher information
  const teacherName = teacher ? 
    `${teacher.firstName} ${teacher.lastName}` : 
    'Unknown Teacher';
  const teacherImage = teacher?.profileImage || '/placeholder-avatar.jpg';

  return (
    <Card 
      className="h-full overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative aspect-video">
        <img
          src={thumbnail || '/placeholder-event.jpg'}
          alt={title}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        {featured && (
          <Badge className="absolute top-2 right-2 bg-primary">
            Featured
          </Badge>
        )}
      </div>

      <div className="p-4">
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="secondary" className="text-xs">
            <Tag className="h-3 w-3 mr-1" />
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {category}
          </Badge>
          {isSoldOut && (
            <Badge variant="destructive" className="text-xs">
              Sold Out
            </Badge>
          )}
        </div>

        <h3 className="font-semibold line-clamp-2 text-lg mb-3">{title}</h3>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
            <div>
              <div>{format(new Date(startDate), 'MMM d, yyyy')}</div>
              <div className="text-xs">
                {format(new Date(startDate), 'h:mm a')} - 
                {format(new Date(endDate), 'h:mm a')}
              </div>
            </div>
          </div>

          <div className="flex items-center text-sm text-muted-foreground">
            {isOnline ? (
              <>
                <Video className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>Online Event</span>
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                <div className="line-clamp-1">
                  {location.city}, {location.country}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-2 flex-shrink-0" />
            <div>
              {registrationCount} registered
              {!isSoldOut && <span className="text-xs ml-1">({spotsLeft} spots left)</span>}
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {teacher && (
                <>
                  <img
                    src={teacherImage}
                    alt={teacherName}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-sm font-medium">{teacherName}</div>
                    {teacher.department && (
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs">
                          <GraduationCap className="h-3 w-3 mr-1" />
                          {teacher.department}
                        </Badge>
                        {teacher.qualification && (
                          <span className="text-xs text-muted-foreground">
                            • {teacher.qualification}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            {lowestPrice !== null && (
              <div className="text-right">
                <div className="text-lg font-bold">
                  {lowestPrice === 0 ? 'Free' : `From £${lowestPrice}`}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}