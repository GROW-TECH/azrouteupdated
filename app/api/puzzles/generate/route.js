// app/api/puzzles/generate/route.js
import { NextResponse } from "next/server";
import { supabaseServer as supabase } from "@/lib/supabaseServer";
import { Chess } from "chess.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) console.error("OPENAI_API_KEY missing");

async function callAI(prompt) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 250,
      temperature: 0.0,
    }),
  });

  if (!r.ok) throw new Error(await r.text());

  const j = await r.json();
  return j.choices?.[0]?.message?.content || "";
}

function extractJson(text) {
  const s = text.indexOf("{");
  const e = text.lastIndexOf("}");
  if (s === -1 || e === -1) throw new Error("No JSON found");
  return JSON.parse(text.slice(s, e + 1));
}

function buildPrompt() {
  return `Return ONLY a JSON object exactly like:

{
  "title": "string",
  "moves": ["e2e4","g8f6"],
  "hint": "string",
  "tags": ["tactic"],
  "difficulty": 2
}

Rules:
- Moves MUST be legal from the starting position.
- Use UCI ("e2e4") preferred. SAN allowed.
- 2–6 moves only.
- NO FEN. Server will compute FEN.
- No extra text, no commentary.`;
}

/**
 * Convert an applied chess.js move result to a UCI string:
 *   e.g. { from: 'e7', to: 'e8', promotion: 'q' } -> "e7e8q"
 */
function appliedMoveToUci(applied) {
  if (!applied || !applied.from || !applied.to) return null;
  return applied.from + applied.to + (applied.promotion ? applied.promotion : "");
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { difficulty = 2, make_public = true, level = "General" } = body;

    // 1) Call AI
    let aiText;
    try {
      aiText = await callAI(buildPrompt());
    } catch (err) {
      return NextResponse.json(
        { error: "OpenAI request failed", details: String(err) },
        { status: 500 }
      );
    }

    // 2) Parse JSON
    let parsed;
    try {
      parsed = extractJson(aiText);
    } catch (err) {
      return NextResponse.json(
        { error: "AI returned invalid JSON", aiText },
        { status: 400 }
      );
    }

    if (!Array.isArray(parsed.moves)) {
      return NextResponse.json(
        { error: "AI returned missing/invalid moves array", parsed },
        { status: 400 }
      );
    }

    // sanitize moves (trim strings)
    const rawMoves = parsed.moves.map(m => (typeof m === "string" ? m.trim() : m));

    // enforce length rules (2-6 moves)
    if (rawMoves.length < 2 || rawMoves.length > 6) {
      return NextResponse.json(
        { error: "AI returned wrong number of moves (must be 2–6)", count: rawMoves.length, parsed },
        { status: 400 }
      );
    }

    // 3) Apply moves & build FEN, while converting each to canonical UCI
    const chess = new Chess();
    const uciMoves = [];

    for (const mv of rawMoves) {
      let applied = null;

      // If the move is already an object like { from, to, promotion }, try applying directly.
      if (mv && typeof mv === "object" && mv.from && mv.to) {
        try {
          applied = chess.move(mv); // chess.js accepts object move
        } catch (_) {
          applied = null;
        }
      }

      // Try SAN (sloppy) if mv is a string (handles "Nf3", "e4", etc.)
      if (!applied && typeof mv === "string") {
        try {
          applied = chess.move(mv, { sloppy: true });
        } catch (_) {
          applied = null;
        }
      }

      // Try UCI string fallback if the string looks like uci (e2e4 or e7e8q)
      if (!applied && typeof mv === "string" && /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(mv)) {
        const raw = mv.trim();
        const from = raw.slice(0, 2);
        const to = raw.slice(2, 4);
        const promotion = raw[4] || undefined;
        try {
          applied = chess.move({ from, to, promotion });
        } catch (_) {
          applied = null;
        }
      }

      if (!applied) {
        return NextResponse.json(
          { error: "AI returned illegal or unparsable move", move: mv, parsed, aiText },
          { status: 400 }
        );
      }

      // convert applied move to UCI and store
      const uci = appliedMoveToUci(applied);
      if (!uci) {
        return NextResponse.json(
          { error: "Failed to convert applied move to UCI", applied, parsed, aiText },
          { status: 500 }
        );
      }
      uciMoves.push(uci);
    }

    const finalFen = chess.fen();

    // 4) Insert ONLY FIELDS THAT EXIST IN YOUR TABLE
    const row = {
      fen: finalFen,
      solution: uciMoves, // store canonical UCI moves
      difficulty: parsed.difficulty ?? difficulty,
      tags: parsed.tags || ["tactic"],
      created_at: new Date().toISOString(),
      level, // optional category
      title: parsed.title || "AI Puzzle",
      hint: parsed.hint || null,
      is_public: !!make_public,
      ai_generated: true,
    };

    const { data, error } = await supabase
      .from("puzzles")
      .insert([row])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert failed:", error);
      return NextResponse.json(
        { error: "DB insert failed", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ puzzle: data });
  } catch (err) {
    console.error("Server error in puzzles/generate:", err);
    return NextResponse.json(
      { error: "Server error", details: String(err) },
      { status: 500 }
    );
  }
}
