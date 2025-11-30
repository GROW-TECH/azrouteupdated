'use client';

import { useEffect, useState, useMemo } from 'react';
import { Table, InputGroup, Form, Button } from 'react-bootstrap';
import { FaClipboardList, FaSearch, FaSort } from 'react-icons/fa';
import { supabase } from '@/lib/supabaseClient';

export default function MarksDynamic() {
  const [manualRows, setManualRows] = useState([]);
  const [aiRows, setAiRows] = useState([]);
  const [loadingManual, setLoadingManual] = useState(true);
  const [loadingAi, setLoadingAi] = useState(true);

  const [search, setSearch] = useState('');
  // store sort state per table so toggling one won't break the other
  const [sortManual, setSortManual] = useState({ key: 'total_score', dir: 'desc' });
  const [sortAi, setSortAi] = useState({ key: 'score_pct', dir: 'desc' });

  useEffect(() => {
    let mounted = true;

    async function loadManual() {
      setLoadingManual(true);
      try {
        const { data, error } = await supabase
          .from('assessment_attempts')
          .select(`
            id,
            student_id,
            student_email,
            assessment_id,
            score,
            status,
            started_at,
            completed_at,
            assessment:assessments(
              id, course, date, total_marks
            )
          `)
          .order('student_id', { ascending: true });

        if (error) {
          console.error('Supabase fetch manual error:', error);
          if (mounted) setManualRows([]);
        } else {
          if (mounted) setManualRows(data ?? []);
        }
      } catch (err) {
        console.error('Load manual catch:', err);
        if (mounted) setManualRows([]);
      } finally {
        if (mounted) setLoadingManual(false);
      }
    }

    // inside your useEffect loader (replace existing loadAi)
async function loadAi() {
  setLoadingAi(true);
  try {
    // 1) fetch ai assessments
    const { data: aiData, error: aiError } = await supabase
      .from('aiassessments')
      .select('id,user_id,total_puzzles,correct_count,score_pct,started_at,finished_at,created_at,details')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (aiError) {
      console.error('Supabase fetch ai error:', aiError);
      if (mounted) setAiRows([]);
      return;
    }
    const rows = aiData ?? [];

    // 2) collect unique user_ids (exclude null/anonymous)
    const userIds = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean)));

    // 3) fetch profiles for these user ids (adjust table name/columns if your profiles schema differs)
    let profiles = [];
    if (userIds.length > 0) {
      const { data: pData, error: pError } = await supabase
        .from('profiles')                        // change if your profile table name is different
        .select('id, full_name, email')          // adjust columns as needed (email, full_name, display_name...)
        .in('id', userIds);

      if (pError) {
        console.warn('Could not load profiles for AI rows:', pError);
      } else {
        profiles = pData ?? [];
      }
    }

    // map profile by id for quick lookup
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    // 4) attach profile info onto ai rows for UI
    const enriched = rows.map(r => {
      const prof = profileMap.get(r.user_id) ?? null;
      return {
        ...r,
        student_email: prof?.email ?? null,
        student_name: prof?.full_name ?? prof?.email ?? null,
      };
    });

    if (mounted) setAiRows(enriched);
  } catch (err) {
    console.error('Load ai catch:', err);
    if (mounted) setAiRows([]);
  } finally {
    if (mounted) setLoadingAi(false);
  }
}


    loadManual();
    loadAi();

    return () => { mounted = false; };
  }, []);

  // ---- Manual aggregation per student (same approach you had) ----
  const manualStudents = useMemo(() => {
    const map = new Map();
    for (const row of manualRows) {
      const sid = row.student_id ?? row.student_email ?? `u-${row.id}`;
      if (!map.has(sid)) {
        map.set(sid, {
          student_id: row.student_id,
          student_email: row.student_email ?? '',
          attempts: [],
          attempts_count: 0,
          total_score: 0,
          possible_total_marks: 0,
          _seenAssessments: new Set(),
        });
      }
      const rec = map.get(sid);
      rec.attempts.push({
        id: row.id,
        assessment: row.assessment ?? null,
        assessment_id: row.assessment?.id ?? row.assessment_id ?? null,
        score: row.score,
        status: row.status,
        started_at: row.started_at,
        completed_at: row.completed_at,
      });
      if (row.score != null) rec.total_score += Number(row.score);
      const aid = row.assessment?.id ?? row.assessment_id;
      if (aid != null && !rec._seenAssessments.has(aid)) {
        rec._seenAssessments.add(aid);
        if (row.assessment?.total_marks != null) rec.possible_total_marks += Number(row.assessment.total_marks);
      }
      rec.attempts_count = rec.attempts.length;
    }

    const arr = Array.from(map.values()).map(s => {
      const percent = s.possible_total_marks > 0
        ? Number(((s.total_score / s.possible_total_marks) * 100).toFixed(2))
        : null;
      const avg_score = s.attempts_count > 0
        ? Number((s.total_score / s.attempts_count).toFixed(2))
        : null;
      const { _seenAssessments, ...clean } = s;
      return { ...clean, percent_of_total: percent, avg_score };
    });

    // search
    const q = search.trim().toLowerCase();
    const filtered = q ? arr.filter(s =>
      (s.student_email || '').toLowerCase().includes(q) ||
      String(s.student_id || '').toLowerCase().includes(q)
    ) : arr;

    // sort
    filtered.sort((a, b) => {
      const k = sortManual.key;
      const ad = a[k] ?? 0;
      const bd = b[k] ?? 0;
      if (ad === bd) return 0;
      const dir = sortManual.dir === 'asc' ? 1 : -1;
      return ad > bd ? dir : -dir;
    });

    return filtered;
  }, [manualRows, search, sortManual]);

  // ---- AI aggregation per student (aggregate aiassessments by user_id) ----
  const aiStudents = useMemo(() => {
    const map = new Map();
    for (const r of aiRows) {
      // ai row user id stored under user_id (text) or null for anonymous
      const sid = r.user_id ?? `anon-${r.id}`;
      if (!map.has(sid)) {
        map.set(sid, {
          student_id: sid,
          student_email: '', // ai table may not have email; keep empty
          attempts: [],
          attempts_count: 0,
          total_score_sum: 0, // sum of correct_count (if present)
          total_possible_puzzles: 0, // sum of total_puzzles if present
          avg_score_pct: null,
        });
      }
      const rec = map.get(sid);
      rec.attempts.push({
        id: r.id,
        total_puzzles: r.total_puzzles,
        correct_count: r.correct_count,
        score_pct: r.score_pct,
        started_at: r.started_at,
        finished_at: r.finished_at,
        details: r.details,
        created_at: r.created_at,
      });
      if (r.correct_count != null) rec.total_score_sum += Number(r.correct_count);
      if (r.total_puzzles != null) rec.total_possible_puzzles += Number(r.total_puzzles);
      rec.attempts_count = rec.attempts.length;
    }

    const arr = Array.from(map.values()).map(s => {
      const avg_pct = s.attempts_count > 0
        ? Number(((s.total_score_sum / (s.total_possible_puzzles || 1)) * 100 / 1).toFixed(2))
        : null;
      return { ...s, avg_score_pct: avg_pct };
    });

    // search
    const q = search.trim().toLowerCase();
    const filtered = q ? arr.filter(s =>
      (s.student_email || '').toLowerCase().includes(q) ||
      String(s.student_id || '').toLowerCase().includes(q)
    ) : arr;

    // sort for AI table
    filtered.sort((a, b) => {
      const k = sortAi.key;
      const ad = a[k] ?? 0;
      const bd = b[k] ?? 0;
      if (ad === bd) return 0;
      const dir = sortAi.dir === 'asc' ? 1 : -1;
      return ad > bd ? dir : -dir;
    });

    return filtered;
  }, [aiRows, search, sortAi]);

  function toggleSortManual(key) {
    setSortManual(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' });
  }
  function toggleSortAi(key) {
    setSortAi(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' });
  }

  // quick refresh both
  async function refreshAll() {
    setLoadingManual(true);
    setLoadingAi(true);
    try {
      const [{ data: m }, { data: a }] = await Promise.all([
        supabase.from('assessment_attempts').select(`
            id, student_id, student_email, assessment_id, score, status, started_at, completed_at,
            assessment:assessments(id, course, date, total_marks)
        `),
        supabase.from('aiassessments').select('id,user_id,total_puzzles,correct_count,score_pct,started_at,finished_at,created_at,details')
      ]);
      setManualRows(m ?? []);
      setAiRows(a ?? []);
    } catch (e) {
      console.error('refreshAll error', e);
    } finally {
      setLoadingManual(false);
      setLoadingAi(false);
    }
  }

  return (
    <div className="bg-white shadow rounded-xl max-w-7xl mx-auto mt-8 p-8">
      <div className="d-flex align-items-center mb-4">
        <FaClipboardList className="me-3 text-primary" style={{ fontSize: 22 }} />
        <h2 className="h4 mb-0">Student Marks</h2>
      </div>

      <div className="d-flex align-items-center gap-2 mb-4">
        <InputGroup style={{ maxWidth: 480 }}>
          <InputGroup.Text><FaSearch /></InputGroup.Text>
          <Form.Control
            placeholder="Search student email or id..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>

        <div className="ms-auto d-flex gap-2">
          <Button variant="outline-secondary" size="sm" onClick={refreshAll}>Refresh</Button>
        </div>
      </div>

      {/* Manual Assessments Table */}
      <div className="mb-6">
        <h5>Manual Assessments</h5>
        <Table bordered hover striped responsive>
          <thead className="table-primary">
            <tr>
              <th>#</th>
              <th>Student (email / id)</th>
              <th onClick={() => toggleSortManual('attempts_count')} style={{ cursor: 'pointer' }}>Attempts <FaSort /></th>
              <th onClick={() => toggleSortManual('total_score')} style={{ cursor: 'pointer' }}>Total Score <FaSort /></th>
              <th onClick={() => toggleSortManual('possible_total_marks')} style={{ cursor: 'pointer' }}>Possible Marks <FaSort /></th>
              <th onClick={() => toggleSortManual('percent_of_total')} style={{ cursor: 'pointer' }}>% of Total <FaSort /></th>
              <th>Avg</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {loadingManual ? (
              <tr><td colSpan="8" className="text-center">Loading manual assessments...</td></tr>
            ) : manualStudents.length > 0 ? (
              manualStudents.map((s, i) => (
                <tr key={`${s.student_email}-${s.student_id}-${i}`}>
                  <td>{i + 1}</td>
                  <td>
                    <div className="fw-semibold">{s.student_email || '—'}</div>
                    <div className="text-muted small">id: {s.student_id ?? '—'}</div>
                  </td>
                  <td>{s.attempts_count}</td>
                  <td>{s.total_score ?? 0}</td>
                  <td>{s.possible_total_marks ?? 0}</td>
                  <td>{s.percent_of_total != null ? `${s.percent_of_total}%` : '—'}</td>
                  <td>{s.avg_score != null ? s.avg_score : '—'}</td>
                  <td>
                    <details>
                      <summary style={{ cursor: 'pointer' }}>View attempts</summary>
                      <div style={{ paddingTop: 8 }}>
                        <Table size="sm" bordered>
                          <thead>
                            <tr>
                              <th>#</th><th>Assessment</th><th>Score</th><th>Status</th><th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {s.attempts.map((a, idx) => (
                              <tr key={a.id ?? idx}>
                                <td>{idx + 1}</td>
                                <td>
                                  {a.assessment ? (
                                    <>
                                      <div className="fw-semibold">{a.assessment.course}</div>
                                      <div className="small text-muted">total: {a.assessment.total_marks}</div>
                                    </>
                                  ) : '—'}
                                </td>
                                <td>{a.score ?? '—'}</td>
                                <td>{a.status}</td>
                                <td>{a.completed_at ? new Date(a.completed_at).toLocaleString() : (a.started_at ? new Date(a.started_at).toLocaleString() : '—')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </details>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="8" className="text-center">No manual records found</td></tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* AI Assessments Table */}
      <div>
        <h5>AI Assessments</h5>
        <Table bordered hover striped responsive>
          <thead className="table-secondary">
            <tr>
              <th>#</th>
              <th>Student (user_id)</th>
              <th onClick={() => toggleSortAi('attempts_count')} style={{ cursor: 'pointer' }}>Attempts <FaSort /></th>
              <th onClick={() => toggleSortAi('total_score_sum')} style={{ cursor: 'pointer' }}>Total Correct <FaSort /></th>
              <th onClick={() => toggleSortAi('total_possible_puzzles')} style={{ cursor: 'pointer' }}>Total Puzzles <FaSort /></th>
              <th onClick={() => toggleSortAi('avg_score_pct')} style={{ cursor: 'pointer' }}>Avg % <FaSort /></th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {loadingAi ? (
              <tr><td colSpan="7" className="text-center">Loading AI assessments...</td></tr>
            ) : aiStudents.length > 0 ? (
              aiStudents.map((s, i) => (
                <tr key={`${s.student_id}-${i}`}>
                  <td>{i + 1}</td>
                  <td>
                    <div className="fw-semibold">{s.student_email || '—'}</div>
                    <div className="text-muted small">id: {s.student_id}</div>
                  </td>
                  <td>{s.attempts_count}</td>
                  <td>{s.total_score_sum ?? 0}</td>
                  <td>{s.total_possible_puzzles ?? 0}</td>
                  <td>{s.avg_score_pct != null ? `${s.avg_score_pct}%` : '—'}</td>
                  <td>
                    <details>
                      <summary style={{ cursor: 'pointer' }}>View AI attempts</summary>
                      <div style={{ paddingTop: 8 }}>
                        <Table size="sm" bordered>
                          <thead>
                            <tr>
                              <th>#</th><th>Correct</th><th>Total</th><th>%</th><th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {s.attempts.map((a, idx) => (
                              <tr key={a.id ?? idx}>
                                <td>{idx + 1}</td>
                                <td>{a.correct_count ?? '—'}</td>
                                <td>{a.total_puzzles ?? '—'}</td>
                                <td>{a.score_pct ?? (a.total_puzzles ? `${((a.correct_count / a.total_puzzles) * 100).toFixed(2)}%` : '—')}</td>
                                <td>{a.created_at ? new Date(a.created_at).toLocaleString() : (a.finished_at ? new Date(a.finished_at).toLocaleString() : '—')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </details>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" className="text-center">No AI records found</td></tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
