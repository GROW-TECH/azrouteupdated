// app/dashboard/student/puzzles/weekly/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabaseClient";
import ChessBoard from "@/app/components/ChessBoard";
import PuzzleCard from "@/app/components/PuzzleCard";

export default function WeeklyPuzzlePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(true);
  const [puzzle, setPuzzle] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  // load weekly puzzle (no level filter)
  useEffect(() => {
    async function loadWeeklyPuzzle() {
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

        // week of year (1..53) then map to 0..len-1
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const days = Math.floor((now - start) / 86400000);
        const weekOfYear = Math.floor((days + start.getDay() + 1) / 7);
        const index = weekOfYear % puzzles.length;
        setPuzzle(puzzles[index]);
      } catch (err) {
        console.error(err);
        setError("Failed to load puzzles.");
      } finally {
        setLoading(false);
      }
    }

    loadWeeklyPuzzle();
  }, []); // no level dependency

  async function handleGenerateAI() {
    if (!session?.user) return alert("Please login.");
    setGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/puzzles/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          difficulty: 2,
          make_public: true,
        }),
      });

      const status = res.status;
      const text = await res.text();
      let json;
      try {
        json = text ? JSON.parse(text) : null;
      } catch (e) {
        console.error("Server returned non-JSON:", text);
      }

      if (!res.ok) {
        console.error("Generate API error", { status, body: text, json });
        setError((json && (json.error || json.message)) || text || `Generation failed (status ${status})`);
        setGenerating(false);
        return;
      }

      const newPuzzle = (json && json.puzzle) || null;
      if (!newPuzzle) {
        setError("AI returned no puzzle.");
        setGenerating(false);
        return;
      }

      setPuzzle(newPuzzle);
      setGenerating(false);
    } catch (err) {
      console.error("Network or unexpected error:", err);
      setError(err?.message || "Generation request failed.");
      setGenerating(false);
    }
  }

  async function handleSolved() {
    if (!session?.user) return alert("Login required");
    try {
      await fetch("/api/puzzles/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puzzle_id: puzzle.id, solved: true }),
      });
      alert("Solved! Progress saved.");
    } catch (err) {
      console.error("Save solved error:", err);
      alert("Could not save progress.");
    }
  }

  if (status === "loading" || loading) return <div className="p-4">Loading your weekly puzzle...</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Weekly Puzzle</h1>
        <div className="flex items-center gap-3">
          <button
            className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-60"
            onClick={handleGenerateAI}
            disabled={generating}
          >
            {generating ? "Generating..." : "Generate AI Puzzle"}
          </button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {!puzzle ? (
        <div className="p-4 border rounded">No weekly puzzle for your level. Try generating one.</div>
      ) : (
        <>
          <PuzzleCard puzzle={puzzle} />
          <ChessBoard fen={puzzle.fen} solution={puzzle.solution} onSolved={handleSolved} />
        </>
      )}
    </div>
  );
}
