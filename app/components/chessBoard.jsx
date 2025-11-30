"use client";

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

const ChessBoard = forwardRef(({
  fen = "start",
  prefilledMoves = [],
  onUserMovesChange = () => {},
  isInteractive = true,
  boardWidth = 640,
  resetKey,
}, ref) => {
  const [game, setGame] = useState(new Chess(fen !== "start" ? fen : undefined));
  const [boardFen, setBoardFen] = useState(fen);
  const [userMoves, setUserMoves] = useState([]);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [highlightedSquares, setHighlightedSquares] = useState({});
  const [prefilledSAN, setPrefilledSAN] = useState([]);

  const localResetKey = useRef(resetKey);

  useImperativeHandle(ref, () => ({ reset: internalReset }));

  // Robust tryApplyMove that handles UCI strings, SAN strings, and move objects
  const tryApplyMove = (chessInstance, mv) => {
    if (!mv) return null;

    // If mv is an object with from/to (UCI-like object), apply directly (no sloppy option)
    if (typeof mv === "object" && mv.from && mv.to) {
      try {
        const applied = chessInstance.move(mv); // chess.js accepts object
        if (applied) return applied;
      } catch (e) {
        // fall through to try other forms
      }
    }

    // If mv is a string that looks like UCI (e2e4 or e7e8q)
    if (typeof mv === "string" && /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(mv.trim())) {
      const raw = mv.trim();
      const from = raw.slice(0, 2);
      const to = raw.slice(2, 4);
      const promotion = raw[4] || undefined;
      try {
        const applied = chessInstance.move({ from, to, promotion });
        if (applied) return applied;
      } catch (e) {
        // continue to try as SAN below
      }
    }

    // Finally, try SAN parsing (string SAN). Use sloppy option only for SAN strings.
    if (typeof mv === "string") {
      try {
        const applied = chessInstance.move(mv, { sloppy: true });
        if (applied) return applied;
      } catch (e) {
        // ignore
      }
    }

    return null;
  };

  const internalReset = () => {
    const g = new Chess(fen !== "start" ? fen : undefined);
    const appliedSAN = [];
    if (Array.isArray(prefilledMoves) && prefilledMoves.length > 0) {
      for (const mv of prefilledMoves) {
        const applied = tryApplyMove(g, mv);
        if (!applied) break;
        appliedSAN.push(applied.san);
      }
    }
    setGame(g);
    setBoardFen(g.fen());
    setPrefilledSAN(appliedSAN);
    setUserMoves([]);
    setSelectedSquare(null);
    setHighlightedSquares({});
  };

  useEffect(() => {
    if (localResetKey.current === resetKey && boardFen) return;
    localResetKey.current = resetKey;
    internalReset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, JSON.stringify(prefilledMoves), resetKey]);

  useEffect(() => onUserMovesChange(userMoves), [userMoves, onUserMovesChange]);

  const onSquareClick = (square) => {
    if (!isInteractive) return;

    if (selectedSquare && highlightedSquares[square]) {
      const g = new Chess(game.fen());
      // apply object-move (from/to)
      const moveObj = { from: selectedSquare, to: square, promotion: "q" };
      const moveResult = tryApplyMove(g, moveObj);
      if (moveResult) {
        setGame(g);
        setBoardFen(g.fen());
        setUserMoves(prev => [...prev, moveResult.san]);
      }
      setSelectedSquare(null);
      setHighlightedSquares({});
      return;
    }

    const moves = game.moves({ square, verbose: true });
    if (!moves || moves.length === 0) {
      setSelectedSquare(null);
      setHighlightedSquares({});
      return;
    }

    const highlights = {};
    moves.forEach(m => highlights[m.to] = { background: "rgba(255,255,0,0.5)" });
    setHighlightedSquares(highlights);
    setSelectedSquare(square);
  };

  const renderMoveList = () => {
    const combined = [...prefilledSAN, ...userMoves];
    const rows = [];
    for (let i = 0; i < combined.length; i += 2) {
      const whiteMove = combined[i];
      const blackMove = combined[i + 1];

      const formatMove = (san) => {
        if (!san) return "";
        try {
          const c = new Chess(fen !== "start" ? fen : undefined);
          const applied = c.move(san, { sloppy: true });
          if (!applied) return san;
          const pieces = { p: "Pawn", n: "Knight", b: "Bishop", r: "Rook", q: "Queen", k: "King" };
          return `${pieces[applied.piece]} (${applied.color === "w" ? "White" : "Black"}) → ${applied.to}`;
        } catch {
          return san;
        }
      };

      rows.push({ white: formatMove(whiteMove), black: formatMove(blackMove) });
    }

    return (
      <table className="mt-2 text-sm w-full table-fixed border-collapse">
        <thead>
          <tr className="bg-blue-100">
            <th className="p-1 border border-gray-300 w-1/2">White</th>
            <th className="p-1 border border-gray-300 w-1/2">Black</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx}>
              <td className="p-1 border border-gray-300">{r.white}</td>
              <td className="p-1 border border-gray-300">{r.black}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="w-full max-w-[900px] mx-auto">
      <div className="rounded-lg overflow-hidden border shadow-sm">
        <Chessboard
          id="PuzzleBoard"
          position={boardFen}
          arePiecesDraggable={false}
          onSquareClick={onSquareClick}
          customSquareStyles={highlightedSquares}
          boardWidth={boardWidth}
          customDarkSquareStyle={{ backgroundColor: "#1E40AF" }}
          customLightSquareStyle={{ backgroundColor: "#EFF6FF" }}
        />
      </div>
      {renderMoveList()}
    </div>
  );
});

export default ChessBoard;
