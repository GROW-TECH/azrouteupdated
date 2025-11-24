import { NextResponse } from "next/server";
import { supabaseServer as supabase } from "@/lib/supabaseServer";
import { Chess } from "chess.js";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { puzzle_id, moves = [], time_ms = 0 } = body;

    if (!puzzle_id) return NextResponse.json({ error: "puzzle_id required" }, { status: 400 });

    const { data: puzzle, error } = await supabase
      .from("puzzles")
      .select("id, fen, solution, difficulty, title")
      .eq("id", puzzle_id)
      .single();

    if (error || !puzzle) return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });

    const solution = Array.isArray(puzzle.solution) ? puzzle.solution : [];
    const initialFen = puzzle.fen || "start";

    const tryApplyMove = (chessInstance, mv) => {
      if (!mv) return null;

      // Handle UCI moves first
      if (/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(mv)) {
        const from = mv.slice(0, 2);
        const to = mv.slice(2, 4);
        const promotion = mv[4] || undefined;
        const applied = chessInstance.move({ from, to, promotion });
        if (applied) return applied;
      }

      // Then SAN moves
      try {
        const applied = chessInstance.move(mv, { sloppy: true });
        if (applied) return applied;
      } catch {}

      return null;
    };

    // Validate user moves
    const chess = new Chess(initialFen === "start" ? undefined : initialFen);
    let illegalMove = null;
    for (const mv of moves) {
      if (!tryApplyMove(chess, mv)) {
        illegalMove = mv;
        break;
      }
    }

    let correct = false;
    let reason = "";
    const chessSolution = new Chess(initialFen === "start" ? undefined : initialFen);
    solution.forEach(mv => tryApplyMove(chessSolution, mv));

    if (illegalMove) {
      correct = false;
      reason = "Illegal move: " + illegalMove;
    } else {
      correct = chess.fen() === chessSolution.fen();
      reason = correct ? "Excellent! Final position matches." : "Final position differs.";
    }

    // Scoring
    const baseScore = 100;
    const diffMod = Math.max(0, (puzzle.difficulty ?? 1) - 1) * 15;
    const timePenalty = Math.floor(Math.max(0, (time_ms || 0) / 1000 - 10));
    const movePenalty = Math.max(0, moves.length - solution.length) * 5;
    const score = correct ? Math.max(0, baseScore - diffMod - timePenalty - movePenalty) : 0;

   return NextResponse.json({
  correct,
  score: computedScore,
  reason,
  expected_solution: solution,
  debug: { initialFen, expectedFinalFen, userMoves },
});

  } catch (err) {
    console.error("solve error:", err);
    return NextResponse.json({ error: "Server error", details: String(err) }, { status: 500 });
  }
}
