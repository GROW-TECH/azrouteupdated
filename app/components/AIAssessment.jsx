"use client";
import { useEffect, useState, useRef } from "react";
import Chess from "chess.js"; // if using chess.js v1: import {Chess} from 'chess.js'; check version
import { Chessboard } from "react-chessboard";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "../components/ui/button";

export default function AIAssessment({ user }) {
  const [running, setRunning] = useState(false);
  const [assessmentId, setAssessmentId] = useState(null);
  const [puzzles, setPuzzles] = useState([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [boardFen, setBoardFen] = useState(null);
  const [solution, setSolution] = useState([]); // array of uci moves e.g. ['e2e4']
  const [statusMsg, setStatusMsg] = useState("");
  const chessRef = useRef(null);
  const startTimeRef = useRef(null);

  // helper to call API
  async function startAssessment() {
    setStatusMsg("Starting assessment...");
    const resp = await fetch("/api/ai-assessments/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, count: 8 }),
    });
    const data = await resp.json();
    setAssessmentId(data.assessment_id);
    setPuzzles(data.puzzles);
    if (data.puzzles && data.puzzles.length) {
      loadPuzzleAt(0, data.puzzles);
      setRunning(true);
      setIndex(0);
      setScore(0);
    }
    setStatusMsg("");
  }

  function loadPuzzleAt(i, puzzlesArr = puzzles) {
    const p = puzzlesArr[i];
    if (!p) return;
    setBoardFen(p.fen);
    setSolution(p.solution || []);
    // create chess instance with that fen
    chessRef.current = new Chess(p.fen);
    startTimeRef.current = Date.now();
  }

  // user plays a move on board -> validate whether move equals first move in solution
  async function onUserMove(source, target) {
    // build UCI string
    const uci = `${source}${target}`;
    // For castling / promotions we may need to handle promotion piece: react-chessboard will pass promotion param in some libs.
    // We'll attempt the move locally to verify legality:
    const c = new Chess(chessRef.current.fen());
    const move = c.move({ from: source, to: target, promotion: "q" });
    if (!move) {
      // illegal, do nothing or revert
      setStatusMsg("Illegal move");
      return false; // tell board to revert (react-chessboard expects false)
    }

    // mark time taken
    const timeTaken = Date.now() - startTimeRef.current;

    // Check correctness: compare uci to solution[0]
    const isCorrect = solution.length && (uci === solution[0] || move.san === solution[0]);

    // submit to server
    await fetch("/api/ai-assessments/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assessment_id: assessmentId,
        puzzle_id: puzzles[index].id,
        user_move_uci: uci,
        correct: !!isCorrect,
        time_taken_ms: timeTaken,
      }),
    });

    if (isCorrect) {
      setScore(s => s + 1);
      setStatusMsg("Correct ✓");
    } else {
      setStatusMsg("Incorrect ✗");
    }

    // show engine(s) solution visually: make the solution moves on board with small delay
    // We will animate moves locally:
    if (solution && solution.length) {
      const tempChess = new Chess(puzzles[index].fen);
      // apply solution PV onto the board for demonstration
      for (let mv of solution) {
        // convert uci to move object for chess.js
        const from = mv.slice(0,2), to = mv.slice(2,4);
        // handle promotion if provided
        const prom = mv.length === 5 ? mv[4] : undefined;
        tempChess.move({ from, to, promotion: prom });
      }
      setBoardFen(tempChess.fen());
    }

    // move to next puzzle after short pause
    setTimeout(() => {
      const next = index + 1;
      if (next >= puzzles.length) {
        finishAssessment();
      } else {
        setIndex(next);
        loadPuzzleAt(next);
        setStatusMsg("");
      }
    }, 900);
    return true;
  }

  async function finishAssessment() {
    const r = await fetch("/api/ai-assessments/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessment_id: assessmentId }),
    });
    const data = await r.json();
    setRunning(false);
    setStatusMsg(`Completed. Score: ${score}/${puzzles.length} (accuracy ${data.accuracy.toFixed(1)}%)`);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">AI Assessment</h3>
        {!running ? (
          <Button onClick={startAssessment}>Start AI Assessment</Button>
        ) : (
          <div>Progress: {index+1}/{puzzles.length} — Score: {score}</div>
        )}
      </div>

      {running && boardFen && (
        <div className="flex gap-8">
          <div>
            <Chessboard
              id="ai-assessment-board"
              position={boardFen}
              onPieceDrop={(sourceSquare, targetSquare) => onUserMove(sourceSquare, targetSquare)}
              arePiecesDraggable={true}
              boardWidth={420}
            />
          </div>

          <div className="w-96">
            <div className="p-4 bg-white rounded shadow">
              <p className="text-sm text-gray-600">Puzzle {index + 1} / {puzzles.length}</p>
              <p className="mt-2 text-sm text-gray-800">Difficulty: {puzzles[index].difficulty || 1}</p>
              <p className="mt-4 text-sm text-gray-700">{statusMsg}</p>

              <div className="mt-4 space-y-2">
                <Button variant="outline" onClick={() => {
                  // reveal solution: shows solution PV on board
                  const temp = new Chess(puzzles[index].fen);
                  for (let mv of puzzles[index].solution) {
                    const from = mv.slice(0,2), to = mv.slice(2,4), prom = mv.length===5?mv[4]:undefined;
                    temp.move({ from, to, promotion: prom });
                  }
                  setBoardFen(temp.fen());
                }}>Reveal Solution</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!running && statusMsg && (
        <div className="mt-4 p-4 bg-gray-50 rounded">{statusMsg}</div>
      )}
    </div>
  );
}
