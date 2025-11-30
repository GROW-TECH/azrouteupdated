'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function TakeAssessment() {
  const pathname = usePathname();
  const attemptId = Number(pathname.split('/').pop());
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null); 
  const [attemptCount, setAttemptCount] = useState(0); // 🔥 NEW
  const [attemptBlocked, setAttemptBlocked] = useState(false); // 🔥 NEW

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);

    // Load attempt
    const { data: attempt } = await supabase
      .from('assessment_attempts')
      .select('*')
      .eq('id', attemptId)
      .single();

    // Load assessment
    const { data: a } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', attempt.assessment_id)
      .single();

    setAssessment(a);

    // 🔥 Count previous attempts for this assessment
    const { data: prevAttempts } = await supabase
      .from('assessment_attempts')
      .select('id')
      .eq('assessment_id', a.id)
      .eq('student_id', attempt.student_id);

    setAttemptCount(prevAttempts.length);

    // Block if more than 3 attempts
    if (prevAttempts.length >= 3) {
      setAttemptBlocked(true);
      setLoading(false);
      return;
    }

    // Load questions
    const { data: q } = await supabase
      .from('questions')
      .select('*')
      .eq('assessment_id', a.id)
      .order('id');

    setQuestions(q);
    setLoading(false);
  }

  async function submit() {
    const res = await fetch('/api/attempts/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attemptId, answers }),
    });

    const json = await res.json();
    if (!res.ok) return alert(json.error);

    setResult(json);
  }

  if (loading) return <div className="p-6">Loading...</div>;

  // 🔥 Blocked screen if user exceeded attempts
  if (attemptBlocked) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-red-600">❌ Attempt Limit Reached</h2>
        <p className="mt-2 text-gray-700 text-lg">
          You have already used all <b>3 attempts</b> for this assessment.
        </p>

        <button
          onClick={() => router.push('/dashboard/student/assessment')}
          className="mt-6 px-5 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded shadow"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const totalQuestions = questions.length;
  const correctCount = result?.results?.filter(r => r.correct).length || 0;

  return (
    <div className="p-6 max-w-3xl mx-auto">

      <h1 className="text-2xl font-semibold mb-4">
        {assessment.course} — {assessment.level}
      </h1>

      {/* ⭐ Show Attempt Count */}
      <div className="text-sm text-gray-600 mb-3">
        Attempt: <b>{attemptCount}</b> / 3
      </div>

      {result && (
        <div className="p-4 bg-green-100 text-green-800 border border-green-300 rounded mb-6">
          <h2 className="text-xl font-bold">🏆 Your Score: {result.total}</h2>
          <p className="mt-1 text-sm">
            Correct Answers: <b>{correctCount}</b> / {totalQuestions}
          </p>
        </div>
      )}

      {questions.map((q, index) => {
        const submitted = Boolean(result);
        const qResult = result?.results?.find(r => r.question_id === q.id);
        const correct = qResult?.correct;
        const wrong = qResult && !qResult.correct;

        return (
          <div
            key={q.id}
            className={`p-4 border rounded mb-4 ${
              correct ? 'bg-green-50 border-green-400' : ''
            } ${wrong ? 'bg-red-50 border-red-400' : ''}`}
          >
            <div className="font-medium text-lg mb-2">
              Q{index + 1}. {q.question}
            </div>

            {q.type === 'mcq' &&
              q.options?.map((opt, idx) => {
                const val = String(idx + 1);
                return (
                  <label key={idx} className="block mt-2">
                    <input
                      type="radio"
                      name={`q${q.id}`}
                      disabled={submitted}
                      checked={answers[q.id] === val}
                      onChange={() =>
                        setAnswers({ ...answers, [q.id]: val })
                      }
                    />{' '}
                    {opt}
                  </label>
                );
              })}

            {q.type === 'short' && (
              <input
                className="border p-2 mt-2 w-full rounded"
                disabled={submitted}
                value={answers[q.id] || ''}
                onChange={(e) =>
                  setAnswers({ ...answers, [q.id]: e.target.value })
                }
              />
            )}

            {submitted && (
              <>
                {correct && <div className="mt-2 text-green-700 font-medium">✅ Correct!</div>}
                {wrong && <div className="mt-2 text-red-700 font-medium">❌ Wrong Answer</div>}
              </>
            )}
          </div>
        );
      })}

      {!result && (
        <button
          onClick={submit}
          className="mt-6 px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded shadow"
        >
          Submit Assessment
        </button>
      )}

      {result && (
        <button
          onClick={() => router.push('/dashboard/student/assessment')}
          className="mt-6 px-5 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded shadow"
        >
          Back to Dashboard
        </button>
      )}
    </div>
  );
}
