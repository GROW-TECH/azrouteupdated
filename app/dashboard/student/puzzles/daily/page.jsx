"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabaseClient";
import ChessBoard from "@/app/components/ChessBoard";
import PuzzleCard from "@/app/components/PuzzleCard";

export default function DailyPuzzlePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [puzzle, setPuzzle] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const [prefilledMoves, setPrefilledMoves] = useState([]);
  const [userMoves, setUserMoves] = useState([]);
  const [resetKey, setResetKey] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const startTimeRef = useRef(null);
  const prevMovesRef = useRef([]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  useEffect(() => {
    if (!session?.user?.email) return;
    async function loadStudent() {
      const { data, error } = await supabase
        .from("student_list")
        .select("*")
        .eq("email", session.user.email)
        .single();
      if (!error && data) setStudent(data);
    }
    loadStudent();
  }, [session]);

  useEffect(() => {
    async function loadDailyPuzzle() {
      setLoading(true);
      setError("");
      try {
        const { data: puzzles, error } = await supabase
          .from("puzzles")
          .select("*")
          .eq("is_public", true)
          .order("created_at", { ascending: true });
        if (error) throw error;
        if (!puzzles || puzzles.length === 0) {
          setPuzzle(null);
          setLoading(false);
          return;
        }
        const today = new Date();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
        const index = dayOfYear % puzzles.length;
        setPuzzle(puzzles[index]);
        setResetKey(prev => prev + 1);
      } catch (err) {
        console.error(err);
        setError("Failed to load puzzles.");
      } finally {
        setLoading(false);
      }
    }
    loadDailyPuzzle();
  }, []);

  useEffect(() => {
    if (!puzzle) return;
    let prefill = [];
    if (Array.isArray(puzzle.prefilled_moves) && puzzle.prefilled_moves.length > 0) {
      prefill = puzzle.prefilled_moves.slice();
    } else if (Array.isArray(puzzle.solution) && puzzle.solution.length > 1) {
      prefill = puzzle.solution.slice(0, puzzle.solution.length - 1);
    }
    setPrefilledMoves(prefill);
    setUserMoves([]);
    startTimeRef.current = null;
    prevMovesRef.current = [];
    setLastResult(null);
    setResetKey(prev => prev + 1);
  }, [puzzle?.id]);

  function handleUserMovesChange(moves) {
    const newMoves = Array.isArray(moves) ? moves : [];
    const changed = newMoves.length !== prevMovesRef.current.length ||
      newMoves.some((m, i) => m !== prevMovesRef.current[i]);
    if (changed) {
      setUserMoves(newMoves);
      prevMovesRef.current = newMoves;
      if (!startTimeRef.current && newMoves.length > 0) startTimeRef.current = Date.now();
    }
  }

  async function handleGenerateAI() {
    if (!session?.user) return alert("Please login.");
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/puzzles/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty: 2, make_public: true }),
      });
      const json = await res.json();
      if (!res.ok || !json?.puzzle) {
        setError(json?.error || "Generation failed");
        setGenerating(false);
        return;
      }
      setPuzzle(json.puzzle);
      setUserMoves([]);
      setLastResult(null);
      setResetKey(prev => prev + 1);
      setGenerating(false);
    } catch (err) {
      console.error(err);
      setError("Generation failed");
      setGenerating(false);
    }
  }

  async function handleSubmitSolution() {
    if (!puzzle) return alert("No puzzle to submit");
    if (!session?.user?.id) return alert("Login required");

    setSubmitting(true);
    setError("");
    const combinedMoves = [...(prefilledMoves || []), ...(userMoves || [])];
    const time_ms = startTimeRef.current ? Date.now() - startTimeRef.current : 0;

    try {
      const res = await fetch("/api/puzzles/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puzzle_id: puzzle.id,
          user_id: session.user.id,
          moves: combinedMoves,
          time_ms,
          validation: "final",
        }),
      });
      const json = await res.json();
      setLastResult(json);
      setShowModal(true);
    } catch (err) {
      console.error(err);
      setError("Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading" || loading) return <div className="p-4">Loading your  puzzle...</div>;

  const getMotivation = (score) => {
    if (score === 0) return "Don't worry! Keep practicing and you'll improve. 💪";
    if (score < 50) return "Almost there! Try again and aim for a higher score.";
    return "Great job! Keep up the good work!";
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your  Puzzle</h1>
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-60"
          onClick={handleGenerateAI}
          disabled={generating}
        >
          {generating ? "Generating..." : "Generate AI Puzzle"}
        </button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {!puzzle ? (
        <div className="p-4 border rounded">No puzzles available. Try generating one.</div>
      ) : (
        <>
          <PuzzleCard puzzle={puzzle} />

          <ChessBoard
  fen={puzzle.fen}
  prefilledMoves={prefilledMoves}
  onUserMovesChange={handleUserMovesChange}
  isInteractive={!lastResult?.correct} // disable if correct
  resetKey={resetKey}
  boardWidth={640}
  solutionMoves={lastResult?.correct ? [] : lastResult?.expected_solution || []} // animate only if wrong
  animateSolution={!!lastResult && !lastResult.correct}
/>


          <button
            className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-60 mt-3"
            onClick={handleSubmitSolution}
            disabled={userMoves.length === 0 || submitting}
          >
            {submitting ? "Submitting..." : "Submit Solution"}
          </button>

          {showModal && lastResult && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
              <div className="bg-white rounded p-6 w-96 shadow-lg relative">
                <h2 className="text-lg font-bold mb-2">Puzzle Result</h2>
                <p>
                  Result: <strong className={lastResult.correct ? "text-green-600" : "text-red-600"}>
                    {lastResult.correct ? "Correct ✅" : "Wrong ❌"}
                  </strong>
                </p>
                <p>Score: {lastResult.score ?? 0}</p>
                <p className="text-sm text-gray-600">{getMotivation(lastResult.score ?? 0)}</p>

                {!lastResult.correct && lastResult.expected_solution && (
                  <div className="mt-2 p-2 bg-gray-100 rounded">
                    <h3 className="font-semibold mb-1">Correct Moves:</h3>
                    {lastResult.expected_solution.map((mv, idx) => (
                      <div key={idx} className="text-gray-800 p-1 rounded">{mv}</div>
                    ))}
                  </div>
                )}

                <button
                  className="absolute top-2 right-2 text-gray-500 hover:text-black"
                  onClick={() => setShowModal(false)}
                >
                  ✖
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
