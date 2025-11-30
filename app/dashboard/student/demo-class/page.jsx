// app/demo-classes/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <svg className="w-24 h-24 text-gray-300 mb-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
      </svg>
      <p className="text-gray-500 text-lg">{message}</p>
    </div>
  );
}

export default function DemoClassPage() {
  const { data: session, status } = useSession();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(null);
  const [registeredSet, setRegisteredSet] = useState(new Set());
  const [profile, setProfile] = useState(null); // { course, level }
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    (async () => {
      if (status === 'loading') return;
      setLoading(true);
      setErrorMsg('');
      setClasses([]);
      setProfile(null);

      if (status !== 'authenticated' || !session?.user?.email) {
        setErrorMsg('Sign in to see demo classes for your assigned course & level.');
        setLoading(false);
        return;
      }

      try {
        const email = session.user.email;
        const { data: student, error: sErr } = await supabase
          .from('student_list')
          .select('id, course, level, email')
          .eq('email', email)
          .maybeSingle();

        if (sErr) {
          console.error('student_list lookup error', sErr);
          setErrorMsg('Failed to resolve your profile. Contact admin.');
          setLoading(false);
          return;
        }
        if (!student || (!student.course && !student.level)) {
          setProfile(null);
          setErrorMsg('No assigned course/level found. Admin must assign them.');
          setLoading(false);
          return;
        }

        const course = (student.course || '').trim();
        const level = (student.level || '').trim();

        if (!course || !level) {
          setProfile(null);
          setErrorMsg('Your profile is missing course or level. Admin must assign them.');
          setLoading(false);
          return;
        }

        setProfile({ course, level });

        const { data: demoData, error: clsErr } = await supabase
          .from('demo_classes')
          .select('*')
          .ilike('course', course)
          .ilike('level', level)
          .order('id', { ascending: true });

        if (clsErr) {
          console.error('demo_classes fetch error', clsErr);
          setErrorMsg('Failed to load demo classes for your course/level.');
          setClasses([]);
          setLoading(false);
          return;
        }

        setClasses(demoData ?? []);
        if (!demoData || demoData.length === 0) {
          setErrorMsg(`No demo classes found for ${course} (${level}).`);
        } else {
          setErrorMsg('');
        }

        // registrations by email (next-auth)
        fetchUserRegistrationsByEmail(email);
      } catch (err) {
        console.error('init error', err);
        setErrorMsg('Unexpected error loading demo classes.');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status]);

  async function fetchUserRegistrationsByEmail(email) {
    if (!email) return;
    try {
      const { data, error } = await supabase
        .from('demo_registrations')
        .select('demo_class_id')
        .eq('user_email', email);

      if (!error && data) {
        setRegisteredSet(new Set(data.map(r => r.demo_class_id)));
      }
    } catch (err) {
      console.error('fetchUserRegistrationsByEmail err', err);
    }
  }

  async function handleRegister(cls) {
    if (status !== 'authenticated' || !session?.user?.email) {
      alert('Please sign in to register for a demo class.');
      return;
    }

    const userEmail = session.user.email;
    const userName = session.user.name ?? session.user?.name ?? '';

    try {
      const { data: existing, error: existErr } = await supabase
        .from('demo_registrations')
        .select('id')
        .eq('demo_class_id', cls.id)
        .eq('user_email', userEmail)
        .limit(1);

      if (existErr) {
        console.error('check registration error', existErr);
        alert('Could not check registration status. Try again.');
        return;
      }
      if (existing && existing.length > 0) {
        alert('You are already registered.');
        setRegisteredSet(prev => new Set(prev).add(cls.id));
        return;
      }
    } catch (err) {
      console.error('check existing registration failed', err);
      alert('Could not verify registration. Try again.');
      return;
    }

    setRegistering(cls.id);
    const payload = {
      demo_class_id: cls.id,
      user_id: null,
      user_email: userEmail,
      user_name: userName
    };

    try {
      const { error } = await supabase.from('demo_registrations').insert([payload]);
      setRegistering(null);
      if (error) {
        console.error('registration insert error', error);
        alert('Registration failed: ' + error.message);
        return;
      }

      setRegisteredSet(prev => new Set(prev).add(cls.id));
      // small toast alternative:
      alert('Registered successfully!');

      if (cls.meet_link) window.open(cls.meet_link, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('register err', err);
      setRegistering(null);
      alert('Registration failed due to an unexpected error.');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-start justify-between gap-6 mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Free Demo Classes</h1>
              <p className="mt-2 text-sm text-slate-500">
                {profile ? (
                  <>Showing demo classes for <span className="font-medium">{profile.course}</span> — <em className="text-slate-600">{profile.level}</em>.</>
                ) : (
                  <>Register for a free demo class. Sign in to see classes for your course & level.</>
                )}
              </p>
            </div>

            
          </div>

          {errorMsg && (
            <div className="mb-6 rounded-md bg-amber-50 border border-amber-100 p-3 text-amber-800 text-sm">
              {errorMsg}
            </div>
          )}

          {loading ? (
            <div className="py-20">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-slate-100 rounded w-1/3"></div>
                <div className="h-48 bg-slate-100 rounded"></div>
              </div>
            </div>
          ) : (
            <>
              {classes.length === 0 ? (
                <EmptyState message={errorMsg || 'No demo classes scheduled that match your course/level.'} />
              ) : (
                <div className="grid gap-4">
                  {classes.map((cls) => (
                    <article key={cls.id} className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 rounded-lg border border-slate-100 shadow-sm bg-white hover:shadow-md transition-shadow">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-slate-900 truncate">{cls.title}</h3>
                          <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">{cls.level}</span>
                          {cls.course && <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">{cls.course}</span>}
                        </div>

                        <p className="mt-2 text-sm text-slate-600 line-clamp-3">{cls.description}</p>

                        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 0 0 2-2V8H3v11a2 2 0 0 0 2 2z"/></svg>
                            <span>{cls.time ?? '—'}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3"/></svg>
                            <span>{cls.duration ?? '—'}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M21 10v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6"/></svg>
                            <span>{cls.coach ?? 'Coach'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-stretch md:items-end gap-3 min-w-[180px]">
                        {cls.meet_link ? (
                          <a href={cls.meet_link} target="_blank" rel="noreferrer" className="text-xs text-sky-600 underline truncate max-w-full">{cls.meet_link}</a>
                        ) : (
                          <div className="text-xs text-slate-400">No meeting link</div>
                        )}

                        <div className="flex gap-2 w-full">
                          <button
                            onClick={() => handleRegister(cls)}
                            disabled={registering === cls.id || registeredSet.has(cls.id)}
                            className={`flex-1 py-2 rounded-md text-sm font-medium transition
                              ${registeredSet.has(cls.id) ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-sky-600 text-white hover:bg-sky-700'}`}
                          >
                            {registeredSet.has(cls.id) ? 'Registered' : (registering === cls.id ? 'Registering…' : 'Register')}
                          </button>

                          <a
                            href={cls.meet_link ?? '#'}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => { if (!cls.meet_link) e.preventDefault(); }}
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border ${cls.meet_link ? 'border-slate-200 text-slate-700 hover:bg-slate-50' : 'border-dashed border-slate-100 text-slate-300 cursor-not-allowed'}`}
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M15 10l4 4m0 0l-4 4m4-4H7"/></svg>
                            Join
                          </a>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
