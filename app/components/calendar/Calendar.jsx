// components/calendar/Calendar.jsx
import { useState } from 'react';
import { format, startOfToday, eachDayOfInterval, startOfMonth, endOfMonth, 
  endOfWeek, startOfWeek, isToday, isSameMonth, isEqual, parse, add, getDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

const colStartClasses = [
  '',
  'col-start-2',
  'col-start-3',
  'col-start-4',
  'col-start-5',
  'col-start-6',
  'col-start-7',
];

export function Calendar({ events, onEventClick, userType }) {
  const today = startOfToday();
  const [selectedDay, setSelectedDay] = useState(today);
  const [currentMonth, setCurrentMonth] = useState(format(today, 'MMM-yyyy'));
  const firstDayCurrentMonth = parse(currentMonth, 'MMM-yyyy', new Date());

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(firstDayCurrentMonth)),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
  });

  function previousMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 });
    setCurrentMonth(format(firstDayNextMonth, 'MMM-yyyy'));
  }

  function nextMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 });
    setCurrentMonth(format(firstDayNextMonth, 'MMM-yyyy'));
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-xl">
          {format(firstDayCurrentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={previousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 mt-6 text-xs leading-6 text-gray-500">
        <div className="text-center">S</div>
        <div className="text-center">M</div>
        <div className="text-center">T</div>
        <div className="text-center">W</div>
        <div className="text-center">T</div>
        <div className="text-center">F</div>
        <div className="text-center">S</div>
      </div>
      
      <div className="grid grid-cols-7 mt-2 text-sm">
        {days.map((day, dayIdx) => {
          const dayEvents = events?.filter(event => 
            format(new Date(event.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
          );

          return (
            <div
              key={day.toString()}
              className={cn(
                'min-h-[6rem] p-1 relative',
                dayIdx === 0 && colStartClasses[getDay(day)],
                'border border-gray-100'
              )}
            >
              <button
                onClick={() => setSelectedDay(day)}
                className={cn(
                  'absolute top-1 right-1 w-7 h-7 flex items-center justify-center',
                  isEqual(day, selectedDay) && 'bg-primary text-white rounded-full',
                  !isEqual(day, selectedDay) && isToday(day) && 'text-primary font-semibold',
                  !isEqual(day, selectedDay) && !isToday(day) && !isSameMonth(day, firstDayCurrentMonth) && 'text-gray-300',
                  !isEqual(day, selectedDay) && !isToday(day) && isSameMonth(day, firstDayCurrentMonth) && 'text-gray-900'
                )}
              >
                {format(day, 'd')}
              </button>
              
              <div className="mt-8">
                {dayEvents?.map((event, eventIdx) => (
                  <div
                    key={eventIdx}
                    onClick={() => onEventClick(event)}
                    className={cn(
                      'mb-1 truncate text-xs leading-5 rounded-md p-1 cursor-pointer',
                      event.type === 'class' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    )}
                  >
                    {format(new Date(event.date), 'HH:mm')} - {event.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}