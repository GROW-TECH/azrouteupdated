// app/api/ai-assessment/history/route.js
import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * GET /api/ai-assessment/history
 * - Prefer Authorization: Bearer <access_token>
 * - Fallback to ?userId=... or X-User-Id header (useful for local/dev)
 * - Returns normalized attempts array:
 *   [{ id, created_at, total_questions, correct_answers, started_at, finished_at, details, score_pct }]
 */
export async function GET(req) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });

    // 1) try token from Authorization header
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    let uid = null;

    if (token) {
      const { data: userData, error: userErr } = await supabase.auth.getUser(token);
      if (userErr || !userData?.user) {
        console.warn("history: auth.getUser failed for provided token:", userErr?.message || userErr);
        // do not return 401 here — allow fallback to query param / header
      } else {
        uid = userData.user.id;
      }
    }

    // 2) fallback to query param ?userId=... or X-User-Id header (dev/testing)
    if (!uid) {
      try {
        const url = new URL(req.url);
        const qUserId = url.searchParams.get("userId") || req.headers.get("x-user-id") || null;
        if (qUserId) uid = qUserId;
      } catch (err) {
        // ignore
      }
    }

    if (!uid) {
      return NextResponse.json({ error: "Unauthorized: no token or userId provided" }, { status: 401 });
    }

    // 3) try to fetch from preferred table 'aiassessments' then fallback to 'ai_assessments'
    const tablesToTry = ["aiassessments", "ai_assessments"];
    let rows = null;
    let lastError = null;

    for (const table of tablesToTry) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select("id, created_at, total_puzzles, correct_count, total_questions, correct_answers, started_at, finished_at, details")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(100);

        if (error) {
          // table might not exist — record and continue
          lastError = error;
          continue;
        }

        if (Array.isArray(data)) {
          rows = data;
          break;
        }
      } catch (err) {
        lastError = err;
        continue;
      }
    }

    if (!rows) {
      console.warn("history: no rows found or table missing; last error:", lastError);
      return NextResponse.json({ attempts: [] }, { status: 200 });
    }

    // Normalize rows to the shape the client expects
    const attempts = rows.map((r) => {
      // r may have either total_puzzles/correct_count (aiassessments)
      // or total_questions/correct_answers (ai_assessments). Use whichever exists.
      const totalQuestions = r.total_puzzles ?? r.total_questions ?? null;
      const correctAnswers = (typeof r.correct_count !== "undefined" && r.correct_count !== null)
        ? r.correct_count
        : (typeof r.correct_answers !== "undefined" ? r.correct_answers : null);

      // details may be JSON already or string; ensure it's parsed
      let details = r.details ?? null;
      if (details && typeof details === "string") {
        try {
          details = JSON.parse(details);
        } catch (err) {
          // leave as string if JSON.parse fails
        }
      }

      // score percent (if possible)
      let scorePct = null;
      if (totalQuestions && typeof correctAnswers === "number") {
        scorePct = Math.round((correctAnswers / totalQuestions) * 100);
      }

      return {
        id: r.id,
        created_at: r.created_at,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        started_at: r.started_at ?? null,
        finished_at: r.finished_at ?? null,
        details,
        score_pct: scorePct,
      };
    });

    return NextResponse.json({ attempts }, { status: 200 });
  } catch (err) {
    console.error("GET /api/ai-assessment/history error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
