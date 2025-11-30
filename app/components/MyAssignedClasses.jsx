// components/MyAssignedClasses.jsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; // adjust alias if different

export default function MyAssignedClasses({ courseId }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        // 1) get session (client-side)
        const { data: sessionData, error: sessErr } = await supabase.auth.getSession();
        if (sessErr) throw sessErr;
        const session = sessionData?.session;
        if (!session?.user) {
          setError('Not logged in');
          setClasses([]);
          setLoading(false);
          return;
        }
        const authUid = session.user.id;
        const userEmail = session.user.email?.toLowerCase();

        // 2) find student row (try auth_uid first, fallback to email)
        let { data: student, error: studErr } = await supabase
          .from('student_list')
          .select('id, level, email')
          .eq('auth_uid', authUid)
          .maybeSingle();

        if (studErr) throw studErr;

        if (!student && userEmail) {
          const { data: byEmail, error: byEmailErr } = await supabase
            .from('student_list')
            .select('id, level, email')
            .ilike('email', userEmail)
            .maybeSingle();
          if (byEmailErr) throw byEmailErr;
          student = byEmail || null;
        }

        if (!student) {
          setError('Student profile not found. Please ensure your account is linked to a student record.');
          setClasses([]);
          setLoading(false);
          return;
        }

        // 3) Prefer explicit mapping (class_students) if you have it:
        // const { data: mapped, error: mapErr } = await supabase
        //   .from('class_students')
        //   .select('class_list(id, class_name, date, time, meet_link, meet_conference_id, coach, level)')
        //   .eq('student_id', student.id);
        // if (!mapErr && mapped?.length) { /* use mapped.map(r => r.class_list) */ }

        // 4) Fallback: fetch classes by student's level (future classes)
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const { data: rows, error: rowsErr } = await supabase
          .from('classlist')
          .select('id, class_name, date, time, meet_link, meet_conference_id, coach, level, start_time, end_time')
          .eq('level', student.level)
          .gte('date', today)
          .order('date', { ascending: true })
          .limit(50);

        if (rowsErr) throw rowsErr;

        if (mounted) {
          const normalized = (rows || []).map(c => {
            let meetUrl = c.meet_link || null;
            if (!meetUrl && c.meet_conference_id) {
              const code = c.meet_conference_id.replace(/\s+/g, '');
              meetUrl = `https://meet.google.com/${code}`;
            }
            return { ...c, meetUrl };
          });
          setClasses(normalized);
        }
      } catch (err) {
        console.error(err);
        if (mounted) setError(err.message || 'Failed to load classes.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [courseId]);

  if (loading) return <div>Loading classes…</div>;
  if (error) return <div className="text-danger">Error: {error}</div>;
  if (!classes.length) return <div>No classes assigned.</div>;

  return (
    <div>
      {classes.map(c => (
        <div key={c.id} className="card mb-3">
          <div className="card-body d-flex justify-content-between align-items-center">
            <div>
              <strong className="d-block">{c.class_name}</strong>
              <div className="text-sm text-muted">{c.date} {c.time || (c.start_time ? new Date(c.start_time).toLocaleString() : '')}</div>
              <div className="text-sm">Coach: {c.coach}</div>
            </div>
            <div>
              {c.meetUrl ? (
                <a href={c.meetUrl} className="btn btn-primary" target="_blank" rel="noreferrer">Join Meet</a>
              ) : (
                <button className="btn btn-secondary" disabled>No Meet Link</button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
