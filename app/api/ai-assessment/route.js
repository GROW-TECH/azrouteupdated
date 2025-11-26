// app/api/ai-assessment/route.js
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/** Utility */
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Mock generator (dev) */
async function mockGenerate(numQuestions = 5) {
  const sample = [
    { prompt: "What is the only piece that can jump over other pieces?", choices: ["Bishop", "Knight", "Rook", "Queen"], correct: 1 },
    { prompt: "Which move is known as 'castling'?", choices: ["Moving the king two squares", "Moving the rook two squares", "Moving the king and rook simultaneously", "Moving a pawn two squares forward"], correct: 2 },
    { prompt: "What does 'checkmate' mean?", choices: ["King is in check but can escape", "King is captured", "King is in check and cannot escape", "Draw by repetition"], correct: 2 },
    { prompt: "Which pawn move can capture en passant?", choices: ["A pawn capturing diagonally behind", "A pawn capturing a pawn that moved two squares and passed", "A pawn promoting to a queen", "A pawn capturing on the same file"], correct: 1 },
    { prompt: "What is the usual purpose of developing pieces in the opening?", choices: ["To gain material", "To control the center and prepare king safety", "To restrict opponent pawns only", "To trade off queens early"], correct: 1 },
    { prompt: "Which piece is most valuable in open positions because of long-range power?", choices: ["Knight", "Bishop", "Pawn", "King"], correct: 1 },
    { prompt: "What is a 'pin'?", choices: ["A tactic where a piece is immobilized because moving it exposes a more valuable piece", "A pawn structure", "A checkmate pattern", "A pawn promotion method"], correct: 0 },
    { prompt: "What is the recommended response to a pin on your knight?", choices: ["Ignore it", "Move the pinned piece and hope", "Break the pin with a pawn or exchange", "Sacrifice the queen"], correct: 2 },
  ];

  const pool = shuffleArray(sample).slice(0, Math.min(numQuestions, sample.length));

  return pool.map((s) => {
    const choicesWithIdx = s.choices.map((t, i) => ({ text: t, originalIndex: i }));
    const shuffledChoices = shuffleArray(choicesWithIdx);
    const correctChoiceId = String(shuffledChoices.findIndex((c) => c.originalIndex === s.correct));
    return {
      id: uuidv4(),
      prompt: s.prompt,
      choices: shuffledChoices.map((c, i) => ({ id: String(i), text: c.text })),
      correctChoiceId,
    };
  });
}

/** Normalize model output and shuffle choices */
function shuffleAndFormatQuestions(rawQuestions = [], limit = 5) {
  const chosen = rawQuestions.slice(0, limit);
  return chosen.map((q) => {
    const choicesArr = (q.choices || []).map((text, i) => ({ text, originalIndex: i }));
    const shuffled = shuffleArray(choicesArr);
    const correctIndex = q.correctIndex ?? q.correct ?? q.answerIndex ?? null;
    let correctChoiceId;
    if (typeof correctIndex === "number") {
      correctChoiceId = String(shuffled.findIndex((c) => c.originalIndex === correctIndex));
      if (correctChoiceId === "-1") correctChoiceId = undefined;
    } else if (q.correctAnswer && typeof q.correctAnswer === "string") {
      const found = shuffled.findIndex((c) => c.text.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase());
      correctChoiceId = found >= 0 ? String(found) : undefined;
    } else {
      correctChoiceId = undefined;
    }

    return {
      id: uuidv4(),
      prompt: String(q.prompt || q.question || "Question"),
      choices: shuffled.map((c, i) => ({ id: String(i), text: String(c.text) })),
      correctChoiceId,
    };
  });
}

/** POST - generate questions (mock/OpenAI) */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const numQuestions = Math.min(body.numQuestions ? Number(body.numQuestions) : 5, 10);

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
      const questions = await mockGenerate(numQuestions);
      return NextResponse.json({ questions }, { status: 200, headers: { "Cache-Control": "no-store" } });
    }

    // production OpenAI call (kept minimal)
    const nonce = body.nonce ?? String(Math.floor(Math.random() * 1e9));
    const randomTag = Math.random().toString(36).slice(2, 8);
    const system = `You are a chess assessment generator. Return only strict JSON — a single object: {"questions":[ ... ]}. Each question object must have "prompt" (string), "choices" (array of up to 4 strings) and "correctIndex" (0-based integer). Do NOT include extra text.`;
    const userPrompt = `Generate ${numQuestions} unique multiple-choice chess questions (difficulty="${body.difficulty || "medium"}"). Include tag "${randomTag}-${nonce}". Return STRICT JSON.`;

    const payload = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 800,
    };

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!openaiRes.ok) {
      const txt = await openaiRes.text();
      console.error("OpenAI error:", txt);
      return NextResponse.json({ error: "OpenAI error", details: txt }, { status: 500 });
    }

    const openaiJson = await openaiRes.json();
    const content = openaiJson.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else {
        console.error("Model response parsing failed. Raw content:", content);
        throw new Error("Could not parse JSON from model");
      }
    }

    const rawQuestions = parsed.questions ?? [];
    const questions = shuffleAndFormatQuestions(rawQuestions, numQuestions);

    return NextResponse.json({ questions }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("POST /api/ai-assessment error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

/** PUT - save results into public.aiassessments */
export async function PUT(req) {
  try {
    const body = await req.json().catch(() => ({}));
    console.log("PUT /api/ai-assessment incoming body:", body && typeof body === "object" ? JSON.stringify(body).slice(0, 2000) : body);

    // KEY CHANGE: Extract userEmail and userName from body
    const { 
      userId: bodyUserId, 
      userEmail: bodyUserEmail, 
      userName: bodyUserName, 
      questions, 
      answers, 
      startedAt, 
      finishedAt 
    } = body;

    // Supabase configuration
    const SUPABASE_URL = (process.env.SUPABASE_URL && process.env.SUPABASE_URL.trim()) || (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL.trim());
    let rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (rawServiceKey && rawServiceKey.includes("#")) {
      rawServiceKey = rawServiceKey.split("#")[0].trim();
    }
    const SUPABASE_SERVICE_KEY = rawServiceKey && rawServiceKey.length > 0 ? rawServiceKey : undefined;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error("PUT: Supabase env missing", { SUPABASE_URL: Boolean(SUPABASE_URL), SUPABASE_SERVICE_KEY: Boolean(SUPABASE_SERVICE_KEY) });
      return NextResponse.json({ saved: false, reason: "Supabase not configured" }, { status: 500 });
    }

    const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });

    // User resolution with priority: Auth token > body parameters
    let resolvedUserId = null;
    let studentEmail = bodyUserEmail || null;
    let studentName = bodyUserName || null;
    let resolvedStudentId = null;

    try {
      // First priority: JWT token from Authorization header
      const authHeader = (req.headers.get("authorization") || "").replace("Bearer ", "").trim();
      if (authHeader) {
        const { data: userData, error: userErr } = await supabase.auth.getUser(authHeader);
        if (!userErr && userData?.user) {
          resolvedUserId = userData.user.id;
          // Use auth user's email and name as primary source, but don't override body parameters if they exist
          studentEmail = studentEmail || userData.user.email;
          studentName = studentName || 
                       userData.user.user_metadata?.full_name || 
                       userData.user.user_metadata?.name || 
                       userData.user.email?.split('@')[0];
        }
      }
    } catch (e) {
      console.warn("PUT: token resolve error", e);
    }

    // Final user ID fallback
    const finalUserId = resolvedUserId || bodyUserId || null;

    // If we still don't have email/name and have a user ID, try to resolve from coaches or student_list
    if ((!studentEmail || !studentName) && finalUserId) {
      try {
        // Try coaches table first
        const { data: coach, error: coachErr } = await supabase
          .from("coaches")
          .select("id, name, email")
          .or(`id.eq.${finalUserId},email.eq.${studentEmail}`)
          .maybeSingle();

        if (!coachErr && coach) {
          studentEmail = studentEmail || coach.email;
          studentName = studentName || coach.name;
        }

        // Then try student_list
        if (!studentEmail || !studentName) {
          const { data: student, error: studentErr } = await supabase
            .from("student_list")
            .select("id, name, email")
            .or(`id.eq.${finalUserId},email.eq.${studentEmail}`)
            .maybeSingle();

          if (!studentErr && student) {
            resolvedStudentId = student.id;
            studentEmail = studentEmail || student.email;
            studentName = studentName || student.name;
          }
        }
      } catch (e) {
        console.warn("PUT: user lookup error:", e);
      }
    }

    // Calculate score
    const totalPuzzles = Array.isArray(questions) ? questions.length : 0;
    let correctCount = null;
    if (Array.isArray(questions) && questions.length > 0) {
      const allHaveCorrect = questions.every((q) => typeof q.correctChoiceId !== "undefined");
      if (allHaveCorrect && answers && typeof answers === "object") {
        correctCount = questions.reduce((acc, q) => acc + (answers[q.id] === q.correctChoiceId ? 1 : 0), 0);
      } else {
        correctCount = null;
      }
    } else {
      correctCount = 0;
    }

    // Compute percentage (2 decimal places) when possible
    let scorePct = null;
    if (correctCount !== null && totalPuzzles > 0) {
      scorePct = Number(((correctCount / totalPuzzles) * 100).toFixed(2));
    }

    const details = {
      questions: questions ?? null,
      answers: answers ?? null,
      meta: {
        clientStartedAt: startedAt ?? null,
        clientFinishedAt: finishedAt ?? null,
      },
    };

    // Insert payload - KEY CHANGE: Now student_email and student_name will always have values from body or auth
    const insertPayload = {
      user_id: finalUserId,
      student_id: resolvedStudentId ?? null,
      student_email: studentEmail, // This will now always have a value from body or auth
      student_name: studentName,   // This will now always have a value from body or auth
      total_puzzles: totalPuzzles,
      correct_count: correctCount,
      score_pct: scorePct,
      started_at: startedAt ? new Date(startedAt).toISOString() : null,
      finished_at: finishedAt ? new Date(finishedAt).toISOString() : new Date().toISOString(),
      details,
    };

    console.log("Inserting assessment with email:", studentEmail, "and name:", studentName);

    const { data, error } = await supabase
      .from("aiassessments")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error (aiassessments):", error);
      return NextResponse.json({ saved: false, error: error.message || error }, { status: 500 });
    }

    console.log("Inserted aiassessment id:", data?.id, "for email:", studentEmail);
    return NextResponse.json({ saved: true, record: data }, { status: 200 });
  } catch (err) {
    console.error("PUT /api/ai-assessment error:", err);
    return NextResponse.json({ error: err.message || "Save error" }, { status: 500 });
  }
}