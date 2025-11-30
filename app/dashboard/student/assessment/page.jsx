'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ClipboardList } from 'lucide-react';
import { Button } from '../../../components/ui/button';

/**
 * Dynamic Assessment listing for students.
 * - Finds student course & level from `student_list` by email
 * - Loads matching rows from `assessments` table using ilike (case-insensitive)
 * - Shows Start button when current time is inside the scheduled window.
 *
 * DB expected columns (per your DDL):
 *  id, course, duration, date, start_time, end_time, total_marks, level
 */

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <svg className="w-20 h-20 text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
      </svg>
      <p className="text-gray-500 text-lg">{message}</p>
    </div>
  );
}

/** parse a date string (YYYY-MM-DD) + time string (HH:MM AM/PM or 24:00) into a Date object in local timezone.
 *  The DB stores date and start_time as strings. We attempt to parse common formats.
 */
function parseDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  try {
    const datePart = dateStr.trim();
    let timePart = timeStr.trim();

    // support "10:00 AM" or "13:30"
    const ampmMatch = timePart.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (ampmMatch) {
      let hh = parseInt(ampmMatch[1], 10);
      const mm = ampmMatch[2];
      const ampm = ampmMatch[3].toUpperCase();
      if (ampm === 'PM' && hh !== 12) hh += 12;
      if (ampm === 'AM' && hh === 12) hh = 0;
      timePart = `${hh.toString().padStart(2, '0')}:${mm}`;
    }

    const dt = new Date(`${datePart}T${timePart}:00`);
    if (isNaN(dt.getTime())) return null;
    return dt;
  } catch (e) {
    return null;
  }
}

/** Returns:
 *  - 'upcoming' with msUntilStart when not started yet,
 *  - 'ongoing' when now between start and end,
 *  - 'expired' when end < now
 */
function assessmentStatus(assessment) {
  const now = new Date();
  const start = parseDateTime(assessment.date, assessment.start_time);
  const end = parseDateTime(assessment.date, assessment.end_time);

  if (!start || !end) return { state: 'unknown' };
  if (now < start) return { state: 'upcoming', msUntilStart: start - now };
  if (now >= start && now <= end) return { state: 'ongoing', msUntilEnd: end - now };
  return { state: 'expired' };
}

export default function AssessmentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  // profile now contains id, email, course, level
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [startingAttemptFor, setStartingAttemptFor] = useState(null); // assessment id being started

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      setAssessments([]);
      setProfile(null);

      if (status === 'loading') return;

      if (status !== 'authenticated' || !session?.user?.email) {
        setError('Please sign in to see assessments assigned for your course & level.');
        setLoading(false);
        return;
      }

      try {
        // Resolve student's course & level from student_list by email
        const email = session.user.email;
        const { data: student, error: sErr } = await supabase
          .from('student_list')
          .select('id, course, level, email')
          .eq('email', email)
          .maybeSingle();

        if (sErr) {
          console.error('student_list lookup error', sErr);
          setError('Failed to resolve your profile. Contact admin.');
          setLoading(false);
          return;
        }
        if (!student || (!student.course && !student.level)) {
          setError('No assigned course/level found. Admin must assign them.');
          setLoading(false);
          return;
        }

        const course = (student.course || '').trim();
        const level = (student.level || '').trim();

        // store id and email for starting attempts
        setProfile({ id: student.id, email: student.email, course, level });

        // Query the assessments table using case-insensitive matching (ilike)
        const { data, error: aErr } = await supabase
          .from('assessments')
          .select('*')
          .ilike('course', course)
          .ilike('level', level)
          .order('date', { ascending: true })
          .order('start_time', { ascending: true });

        if (aErr) {
          console.error('assessments fetch error', aErr);
          setError('Failed to load assessments. Try again later.');
          setLoading(false);
          return;
        }

        setAssessments(data ?? []);
        if (!data || data.length === 0) {
          setError(`No assessments found for ${course} (${level}).`);
        }

      } catch (err) {
        console.error('Unexpected error loading assessments', err);
        setError('Unexpected error loading assessments.');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status]);

  function humanTimeRemaining(ms) {
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    if (hr > 0) return `${hr}h ${min % 60}m`;
    if (min > 0) return `${min}m ${sec % 60}s`;
    return `${sec}s`;
  }

  // Action when student clicks Start -> create attempt row then navigate to take page
  const startAttempt = async (assessment) => {
    try {
      if (!profile) {
        alert('Unable to start: student profile not found.');
        return;
      }

      // set local state to show loading on specific button
      setStartingAttemptFor(assessment.id);

      const payload = {
        assessment_id: assessment.id,
        student_id: profile.id ?? null,
        student_email: profile.email ?? null
      };

      const res = await fetch('/api/attempts/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok) {
        console.error('Start attempt failed', json);
        alert('Failed to start attempt: ' + (json.error || 'server error'));
        setStartingAttemptFor(null);
        return;
      }

      if (!json.attempt || !json.attempt.id) {
        console.error('Unexpected response', json);
        alert('Failed to start attempt: invalid server response');
        setStartingAttemptFor(null);
        return;
      }

    
router.push(`/dashboard/student/assessment/take/${json.attempt.id}`);
    } catch (err) {
      console.error('Error starting attempt', err);
      alert('Network error: ' + (err.message || err));
      setStartingAttemptFor(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white p-8 rounded-2xl shadow">
          <div className="flex items-start justify-between gap-6 mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Assessments</h1>
              <p className="mt-2 text-sm text-slate-600">
                {profile ? (
                  <>Assessments for <strong>{profile.course}</strong> — <em>{profile.level}</em>.</>
                ) : (
                  <>Assess your skills with scheduled tests assigned by admin.</>
                )}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-20">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-slate-100 rounded w-1/4"></div>
                <div className="h-40 bg-slate-100 rounded"></div>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-md bg-amber-50 border border-amber-100 p-3 text-amber-800">{error}</div>
          ) : assessments.length === 0 ? (
            <EmptyState message="No assessments are scheduled for your course and level." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assessments.map((a) => {
                const st = assessmentStatus(a);
                const isStarting = startingAttemptFor === a.id;
                return (
                  <div key={a.id} className="p-5 border rounded-lg shadow-sm bg-white flex flex-col">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-sky-50 text-sky-600">
                        <ClipboardList className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-slate-900">Assessment — {a.course} <span className="text-sm text-slate-500">({a.level})</span></h3>
                        <div className="mt-2 text-sm text-slate-600">
                          <div><strong>Date:</strong> {a.date}</div>
                          <div className="mt-1"><strong>On Screen:</strong> {a.start_time} — {a.end_time}</div>
                          <div className="mt-1"><strong>Duration:</strong> {a.duration}</div>
                          <div className="mt-1"><strong>Total Marks:</strong> {a.total_marks}</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-4">
                      <div>
                        {st.state === 'ongoing' && <span className="inline-block text-sm px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">Ongoing — ends in {humanTimeRemaining(st.msUntilEnd)}</span>}
                        {st.state === 'upcoming' && <span className="inline-block text-sm px-2 py-1 rounded bg-sky-50 text-sky-700 border border-sky-100">Starts in {humanTimeRemaining(st.msUntilStart)}</span>}
                        {st.state === 'expired' && <span className="inline-block text-sm px-2 py-1 rounded bg-slate-50 text-slate-500 border border-slate-100">Expired</span>}
                        {st.state === 'unknown' && <span className="inline-block text-sm px-2 py-1 rounded bg-yellow-50 text-yellow-700 border border-yellow-100">Schedule unknown</span>}
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          onClick={() => startAttempt(a)}
                          disabled={st.state !== 'ongoing' || isStarting}
                          className={`${st.state === 'ongoing' ? 'bg-sky-600 hover:bg-sky-700 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                        >
                          {isStarting ? 'Starting...' : 'Start'}
                        </Button>

                        
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
