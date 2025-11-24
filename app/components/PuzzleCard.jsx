// components/PuzzleCard.jsx
"use client";

import React from "react";
import { Chessboard } from "react-chessboard";

export default function PuzzleCard({ puzzle, compact = false }) {
  if (!puzzle) {
    return <div className="p-3 border rounded">No puzzle</div>;
  }

  const { title, difficulty, tags, hint, fen, created_at } = puzzle;

  return (
    <div className={`p-3 border rounded bg-white ${compact ? "max-w-sm" : ""}`}>
      <div className="flex items-start gap-4">
        <div className="w-36">
          <div className="border rounded overflow-hidden">
            <Chessboard
              id={"preview-" + (puzzle.id ?? Math.random())}
              position={fen && fen !== "start" ? fen : undefined}
              arePiecesDraggable={false}
              boardWidth={140}
            />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold">{title || `Puzzle #${puzzle.id}`}</h3>
          <p className="text-sm text-gray-600">Difficulty: {difficulty ?? "-"}</p>

          {tags && Array.isArray(tags) && tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t} className="px-2 py-0.5 bg-gray-100 text-xs rounded">
                  {t}
                </span>
              ))}
            </div>
          )}

          {hint && (
            <div className="mt-3 text-sm text-gray-700">
              <strong>Hint:</strong> {hint}
            </div>
          )}

          {created_at && (
            <div className="mt-2 text-xs text-gray-400">Added: {new Date(created_at).toLocaleDateString()}</div>
          )}
        </div>
      </div>
    </div>
  );
}
