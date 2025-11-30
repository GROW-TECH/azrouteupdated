'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../../../components/ui/card";
import {
  VideoIcon,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import { supabase } from '@/lib/supabaseClient';

export default function SchedulePage() {
  const localIsoFromDate = (d) => {
    const dt = new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayIso = localIsoFromDate(new Date());
  const [selectedDate, setSelectedDate] = useState(() => todayIso);
  const [visibleMonth, setVisibleMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });

  const [monthSessions, setMonthSessions] = useState([]);
  const [sessionsForDay, setSessionsForDay] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLevel, setUserLevel] = useState(null);
  const [classFilter, setClassFilter] = useState('');
  const [classOptions, setClassOptions] = useState([]);

  // deterministic initial 'now' to avoid hydration mismatch
  const [now, setNow] = useState(0);

  const formatISO = (d) => localIsoFromDate(d);
  const monthLabel = useMemo(() => visibleMonth.toLocaleString('default', { month: 'long', year: 'numeric' }), [visibleMonth]);

  useEffect(() => {
    // set real time on client and update every minute
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      await getSessionAndProfile();
      await fetchClassOptions();
      setSelectedDate(todayIso);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchMonthSessions(visibleMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleMonth, userLevel]);

  useEffect(() => {
    updateSessionsForSelectedDate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthSessions, selectedDate, classFilter, now]);

  async function getSessionAndProfile() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) return console.warn('getSession error', error);
      const session = data?.session ?? null;
      if (!session?.user?.id) return;
      const userId = session.user.id;

      const profileRes = await supabase.from('profiles').select('level').eq('id', userId).maybeSingle();
      if (!profileRes.error && profileRes.data?.level) { setUserLevel(profileRes.data.level); return; }
      const usersRes = await supabase.from('users').select('level').eq('id', userId).maybeSingle();
      if (!usersRes.error && usersRes.data?.level) setUserLevel(usersRes.data.level);
    } catch (err) { console.error(err); }
  }

  async function fetchClassOptions() {
    try {
      const { data, error } = await supabase.from('classlist').select('class_name').not('class_name', 'is', null);
      if (error) return console.warn('fetchClassOptions error', error);
      const unique = Array.from(new Set((data || []).map(d => d.class_name).filter(Boolean)));
      setClassOptions(unique);
    } catch (err) { console.error(err); }
  }

  async function fetchMonthSessions(monthDate) {
    setLoading(true);
    try {
      const start = new Date(monthDate); start.setDate(1);
      const end = new Date(monthDate); end.setMonth(end.getMonth() + 1); end.setDate(0);
      const startIso = formatISO(start);
      const endIso = formatISO(end);

      let query = supabase.from('classlist').select('*')
        .gte('date', startIso)
        .lte('date', endIso)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (userLevel) query = query.eq('level', userLevel);

      const { data, error } = await query;
      if (error) setMonthSessions([]);
      else setMonthSessions(data || []);
    } catch (err) { console.error(err); setMonthSessions([]); }
    finally { setLoading(false); }
  }

  // parse s.date + s.time into a Date (local). Expects 'HH:MM' 24-hour format for reliability.
  function parseSessionDateTime(s) {
    if (!s || !s.date) return new Date();
    const time = (s.time || '').trim();
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(time)) {
      const iso = `${s.date}T${time}`;
      const dt = new Date(iso);
      if (!isNaN(dt.getTime())) return dt;
    }
    const dt2 = new Date(`${s.date} ${time}`);
    if (!isNaN(dt2.getTime())) return dt2;
    return new Date(`${s.date}T00:00:00`);
  }

  // update sessions for selectedDate and upcoming list
  function updateSessionsForSelectedDate() {
    // sessions exactly on selected date
    const dayFiltered = (monthSessions || []).filter(s => s.date === selectedDate);
    const dayWithFilter = classFilter ? dayFiltered.filter(s => s.class_name === classFilter) : dayFiltered;
    dayWithFilter.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    setSessionsForDay(dayWithFilter);

    // upcoming baseline:
    // - if selectedDate === today: baseline = now (later today + future dates)
    // - otherwise baseline = end of selectedDate (so upcoming are strictly after selectedDate)
    const baseline =
      selectedDate === todayIso
        ? (now === 0 ? 0 : now)
        : new Date(`${selectedDate}T23:59:59`).getTime();

    const future = (monthSessions || []).filter(s => {
      if (classFilter && s.class_name !== classFilter) return false;
      const dt = parseSessionDateTime(s).getTime();
      return dt > baseline;
    }).sort((a, b) => parseSessionDateTime(a).getTime() - parseSessionDateTime(b).getTime());

    setUpcomingSessions(future.slice(0, 10));
  }

  // expired logic for sessions shown in sessionsForDay
  function isSessionExpiredOnSelectedDate(s) {
    if (!s) return false;
    // if selected date is before today => all expired
    if (selectedDate < todayIso) return true;
    // if selected date is after today => none expired
    if (selectedDate > todayIso) return false;
    // selectedDate === today: compare time with now (if now===0 return false for SSR)
    if (now === 0) return false;
    const dt = parseSessionDateTime(s).getTime();
    return dt <= now;
  }

  const prevMonth = () => { const d = new Date(visibleMonth); d.setMonth(d.getMonth() - 1); setVisibleMonth(d); };
  const nextMonth = () => { const d = new Date(visibleMonth); d.setMonth(d.getMonth() + 1); setVisibleMonth(d); };

  // Prevent selecting past dates: onDayClick will ignore past days
  const onDayClick = (cell) => {
    if (!cell.inMonth || !cell.date) return;
    const iso = formatISO(cell.date);
    if (iso < todayIso) return; // block past date selection
    setSelectedDate(iso);
  };

  const handleJoin = (session) => {
    // protect: don't open expired sessions
    if (isSessionExpiredOnSelectedDate(session)) { alert('This session has expired and cannot be joined.'); return; }
    if (session.meet_link) window.open(session.meet_link, '_blank', 'noopener');
    else alert('No meeting link available for this session.');
  };

  function countSessionsOn(dateIso) {
    return (monthSessions || []).filter(s => s.date === dateIso && (!classFilter || s.class_name === classFilter)).length;
  }

  const grid = (() => {
    const first = new Date(visibleMonth);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const totalCells = 42;
    const cells = [];
    for (let i = 0; i < totalCells; i++) {
      const dayNumber = i - startWeekday + 1;
      if (dayNumber > 0 && dayNumber <= daysInMonth) {
        const cellDate = new Date(first.getFullYear(), first.getMonth(), dayNumber, 0, 0, 0, 0);
        cells.push({ date: cellDate, inMonth: true });
      } else {
        cells.push({ date: null, inMonth: false });
      }
    }
    return cells;
  })();

  const initials = (name = '') => {
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map(p => p[0]?.toUpperCase() || '').join('') || '?';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Schedule</h1>
          <p className="text-sm text-muted-foreground">Click a date to view sessions for that day{userLevel ? ` (${userLevel})` : ''}.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
                  <div className="px-3 py-1 font-medium text-sm">{monthLabel}</div>
                  <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground">Filter class</label>
                  <select className="border rounded px-2 py-1 text-sm w-[140px]" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                    <option value="">All classes</option>
                    {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-7 gap-2 text-center mb-2">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                  <div key={d} className="text-xs font-medium text-muted-foreground">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {grid.map((cell, idx) => {
                  if (!cell.inMonth || !cell.date) return <div key={idx} className="h-9 rounded bg-gray-50/50"></div>;

                  const iso = formatISO(cell.date);
                  const isToday = iso === todayIso;
                  const isSelected = iso === selectedDate;
                  const isPast = iso < todayIso;
                  const count = countSessionsOn(iso);

                if (isPast) {
  return (
    <div
      key={idx}
      title="Past date — not selectable"
      className="
        h-9 rounded-md flex items-center justify-center text-[13px]
        text-gray-700 bg-white
        cursor-not-allowed
        hover:bg-gray-100
      "
    >
      {cell.date.getDate()}
    </div>
  );
}


                  // selectable (today or future)
                  return (
                    <button
                      key={idx}
                      onClick={() => onDayClick(cell)}
                      className={`
                        relative h-9 rounded-md flex flex-col justify-center items-center text-[13px] transition-transform
                        ${isSelected ? 'ring-2 ring-offset-2 ring-indigo-400 bg-white shadow-sm' : 'bg-white'}
                        hover:scale-105 hover:shadow-md
                        focus:outline-none
                      `}
                      title={count > 0 ? `${count} session${count !== 1 ? 's' : ''}` : undefined}
                    >
                      <div className="flex items-center justify-center w-full">
                        <div className={`text-sm font-medium ${isToday ? 'text-indigo-600' : 'text-gray-700'}`}>
                          {cell.date.getDate()}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 text-xs text-muted-foreground">
                {loading ? 'Loading sessions...' : `Showing ${countSessionsOn(selectedDate)} session${countSessionsOn(selectedDate) !== 1 ? 's' : ''} on ${selectedDate}`}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* right column */}
        <div>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-sm">Today's Sessions</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-2">
                {sessionsForDay.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No sessions for selected date.</div>
                ) : (
                  sessionsForDay.map(s => {
                    const expired = isSessionExpiredOnSelectedDate(s);
                    return (
                      <div key={s.id} className="flex items-center justify-between border rounded-md p-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-700">
                            {initials(s.coach)}
                          </div>

                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{s.class_name}</div>
<div className="font-medium text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded-full
  truncate
  ${s.class_type === 'group' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}"
>
  <span className="text-sm">
    {s.class_type === 'group' ? '🟢' : '🔵'}
  </span>
  {s.class_type === 'group' ? 'Group Class' : 'Individual Class'}
</div>

                            <div className="text-xs text-muted-foreground truncate">{s.coach}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-sm text-muted-foreground mr-2">{s.time}</div>
                          {expired ? (
                            <Button size="sm" disabled className="bg-gray-200 text-gray-600 cursor-not-allowed text-sm">Expired</Button>
                          ) : (
                            <Button size="sm" className="bg-[#3b82f6] hover:bg-[#2563eb] text-sm" onClick={() => handleJoin(s)}>
                              <VideoIcon className="h-4 w-4 mr-2" /> Join
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>

            <CardFooter>
              <div className="w-full">
                {sessionsForDay.some(s => s.meet_link && !isSessionExpiredOnSelectedDate(s)) && (
                  <Button className="w-full bg-[#2563eb] hover:bg-[#1e40af] text-sm" onClick={() => {
                    sessionsForDay.forEach(s => { if (s.meet_link && !isSessionExpiredOnSelectedDate(s)) window.open(s.meet_link, '_blank', 'noopener'); });
                  }}>
                    Open All Available
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-sm">Upcoming Sessions</CardTitle>
              <div className="text-xs text-muted-foreground">Next {upcomingSessions.length} session{upcomingSessions.length !== 1 ? 's' : ''}</div>
            </CardHeader>

            <CardContent>
              <div className="space-y-2">
                {upcomingSessions.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No upcoming sessions.</div>
                ) : (
                  upcomingSessions.map(s => (
                    <div key={`up-${s.id}`} className="flex items-center justify-between border rounded-md p-2">
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{s.class_name} <span className="text-xs text-muted-foreground">• {s.date}</span></div>
                        <div className="text-xs text-muted-foreground truncate">{s.coach}</div>
<div className="font-medium text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded-full
  truncate
  ${s.class_type === 'group' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}"
>
  <span className="text-sm">
    {s.class_type === 'group' ? '🟢' : '🔵'}
  </span>
  {s.class_type === 'group' ? 'Group Class' : 'Individual Class'}
</div>

                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground mr-2">{s.time}</div>
                        <Button size="sm" className="bg-[#3b82f6] hover:bg-[#2563eb] text-sm" onClick={() => handleJoin(s)}>
                          <VideoIcon className="h-4 w-4 mr-2" /> Join
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>

            <CardFooter>
              <div className="w-full">
                {upcomingSessions.some(s => s.meet_link) && (
                  <Button className="w-full bg-[#2563eb] hover:bg-[#1e40af] text-sm" onClick={() => {
                    upcomingSessions.forEach(s => { if (s.meet_link) window.open(s.meet_link, '_blank', 'noopener'); });
                  }}>
                    Open All Available
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
