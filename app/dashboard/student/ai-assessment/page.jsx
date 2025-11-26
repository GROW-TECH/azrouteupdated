"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { BrainCircuit, Lightbulb } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import dayjs from "dayjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AIAssessmentPage() {
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [userName, setUserName] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [assessments, setAssessments] = useState([]);
  const [loadingAssessments, setLoadingAssessments] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let mountedInner = true;
    
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mountedInner) return;
        const session = data?.session;
        if (session?.user) {
          setUserId(session.user.id);
          setUserEmail(session.user.email);
          // Get user name from metadata or email
          const name = session.user.user_metadata?.full_name || 
                      session.user.user_metadata?.name || 
                      session.user.email?.split('@')[0] || 
                      "User";
          setUserName(name);
        } else {
          setUserId(null);
          setUserEmail(null);
          setUserName(null);
        }
      })
      .catch((e) => {
        console.warn("getSession error:", e);
        setUserId(null);
        setUserEmail(null);
        setUserName(null);
      });
      
    return () => {
      mountedInner = false;
    };
  }, [mounted]);

  // Fetch assessments by email instead of user_id
  useEffect(() => {
    if (!mounted || !userEmail) return;
    fetchAssessments(userEmail);
  }, [mounted, userEmail]);

  async function fetchAssessments(email) {
    setLoadingAssessments(true);
    try {
      const { data, error } = await supabase
        .from("aiassessments")
        .select("id, user_id, student_email, student_name, total_puzzles, correct_count, score_pct, started_at, finished_at, created_at")
        .eq("student_email", email) // Query by email instead of user_id
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("fetchAssessments error:", error);
        setAssessments([]);
      } else {
        setAssessments(data || []);
      }
    } catch (err) {
      console.error("fetchAssessments catch:", err);
      setAssessments([]);
    } finally {
      setLoadingAssessments(false);
    }
  }

  async function startAssessment() {
    setLoading(true);
    setError(null);
    setQuestions(null);
    setAnswers({});
    setSubmitted(false);
    setScore(null);

    try {
      const res = await fetch("/api/ai-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numQuestions: 5,
          difficulty: "medium",
          userId,
          nonce: Date.now(),
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to generate assessment");
      }

      const data = await res.json();
      setQuestions(data.questions || []);
    } catch (err) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function chooseAnswer(questionId, choiceId) {
    setAnswers((s) => ({ ...s, [questionId]: choiceId }));
  }

  async function submitAnswers() {
    if (!questions) return;
    setSubmitted(true);

    // Compute local score
    const localScore = questions.reduce((acc, q) => {
      if (!q.correctChoiceId) return acc;
      return acc + (answers[q.id] === q.correctChoiceId ? 1 : 0);
    }, 0);
    setScore(localScore);

    // Open modal
    setShowModal(true);

    // Build payload with user email and name
    const payload = {
      userId: userId ?? null,
      userEmail: userEmail ?? null, // Add email explicitly
      userName: userName ?? null,   // Add name explicitly
      questions,
      answers,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
    };

    // Get session token
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token ?? null;

    try {
      const res = await fetch("/api/ai-assessment", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let body;
      try { body = JSON.parse(text); } catch (e) { body = text; }
      console.log("PUT /api/ai-assessment response:", res.status, body);

      if (!res.ok) {
        console.error("Save failed:", res.status, body);
      } else {
        // Success - refresh assessments list
        if (mounted && userEmail) await fetchAssessments(userEmail);
      }
    } catch (err) {
      console.error("Failed to save results:", err);
    }
  }

  const progressPct =
    score != null && questions && questions.length ? Math.round((score / questions.length) * 100) : 0;

  const latest = assessments?.[0] ?? null;

  // Render a stable placeholder until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-blue-600" />
          AI-Based Assessment
        </h2>
        <div className="max-w-4xl mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Personalized Skill Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold flex items-center gap-2">
        <BrainCircuit className="w-6 h-6 text-blue-600" />
        AI-Based Assessment
      </h2>

      {/* User info display - helpful for debugging */}
      {userEmail && (
        <div className="text-sm text-muted-foreground">
          Logged in as: <span className="font-medium">{userName}</span> ({userEmail})
        </div>
      )}

      <div className="max-w-4xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Personalized Skill Insights</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click Start to have the AI generate a short multiple-choice assessment.
            </p>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={startAssessment} disabled={loading}>
                <Lightbulb className="w-4 h-4 mr-2" />
                {loading ? "Generating..." : "Start AI Assessment"}
              </Button>

              {loadingAssessments ? (
                <div className="ml-4 text-sm">Loading your scores...</div>
              ) : latest ? (
                <div className="ml-4 text-sm">
                  <div>
                    Latest: <strong>{latest.correct_count ?? "—"} / {latest.total_puzzles}</strong> ({latest.score_pct ?? "—"}%)
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {assessments.length} total attempts
                  </div>
                </div>
              ) : (
                <div className="ml-4 text-sm">No previous attempts</div>
              )}
            </div>

            {error && <div className="text-red-600">{error}</div>}

            {/* Questions UI */}
            {questions && (
              <div className="space-y-6">
                {questions.map((q, idx) => (
                  <div key={q.id} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="font-medium text-sm">
                      {idx + 1}. {q.prompt}
                    </p>

                    <div className="mt-2 space-y-2">
                      {q.choices.map((c) => {
                        const selected = answers[q.id] === c.id;
                        const showResult = submitted && q.correctChoiceId;
                        const isCorrect = showResult && q.correctChoiceId === c.id;
                        const isWrongSelected = showResult && selected && !isCorrect;

                        return (
                          <label
                            key={c.id}
                            className={`flex items-center gap-2 p-2 rounded cursor-pointer border ${selected ? "border-blue-500" : "border-transparent"} ${isCorrect ? "bg-green-100" : ""} ${isWrongSelected ? "bg-red-100" : ""}`}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              value={c.id}
                              checked={selected}
                              onChange={() => chooseAnswer(q.id, c.id)}
                            />
                            <span className="text-sm">{c.text}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuestions(null);
                      setAnswers({});
                      setSubmitted(false);
                      setScore(null);
                    }}
                  >
                    Cancel
                  </Button>

                  {!submitted ? (
                    <Button onClick={submitAnswers} disabled={Object.keys(answers).length < (questions?.length ?? 0)}>
                      Submit Answers
                    </Button>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div>
                        {questions && questions[0].correctChoiceId ? `Score: ${score} / ${questions.length}` : "Thanks — answers saved."}
                      </div>
                      <Button onClick={() => startAssessment()}>Generate Another</Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* History table */}
        <Card>
          <CardHeader>
            <CardTitle>Your Assessment History</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAssessments ? (
              <div>Loading...</div>
            ) : assessments.length === 0 ? (
              <div className="text-sm text-muted-foreground">You have not taken any AI assessments yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className="py-2">Date</th>
                      <th className="py-2">Score</th>
                      <th className="py-2">Correct</th>
                      <th className="py-2">Total</th>
                      <th className="py-2">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessments.map((a) => (
                      <tr key={String(a.id)} className="border-t">
                        <td className="py-2">{a.created_at ? dayjs(a.created_at).format("DD MMM YYYY HH:mm") : ""}</td>
                        <td className="py-2">{a.score_pct ?? "—"}%</td>
                        <td className="py-2">{a.correct_count ?? "—"}</td>
                        <td className="py-2">{a.total_puzzles ?? "—"}</td>
                        <td className="py-2 text-xs text-muted-foreground">{a.student_email || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal popup */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 w-11/12 max-w-lg">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-semibold">Assessment Complete</h3>
              <button onClick={() => setShowModal(false)} className="text-sm opacity-70 hover:opacity-100">Close</button>
            </div>

            <div className="mt-4">
              <div className="text-sm text-muted-foreground">You scored</div>
              <div className="mt-2 flex items-baseline gap-4">
                <div className="text-4xl font-bold">{score !== null ? score : "—"}</div>
                <div className="text-sm text-muted-foreground">/ {questions ? questions.length : "—"}</div>
              </div>

              <div className="mt-4">
                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                  <div className="h-3 bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-700" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="text-xs text-muted-foreground mt-2">{progressPct}%</div>
              </div>

              <div className="mt-4 text-sm">
                {progressPct >= 80 && <div className="text-green-600 font-medium">Great job! You're doing well — keep practicing to get even better.</div>}
                {progressPct >= 50 && progressPct < 80 && <div className="text-yellow-600 font-medium">Good work — focus on tactics and endgame practice.</div>}
                {progressPct < 50 && <div className="text-red-600 font-medium">Don't worry — try another assessment and focus on the topics the AI highlights.</div>}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShowModal(false); }}>Close</Button>
                <Button onClick={() => { setShowModal(false); startAssessment(); }}>Practice Another</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}