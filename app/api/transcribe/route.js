import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const form = await req.formData();
    const audio = form.get("audio"); // File/Blob from client

    if (!audio || typeof audio === "string") {
      return new Response(JSON.stringify({ error: "No audio provided" }), { status: 400 });
    }

    const result = await openai.audio.transcriptions.create({
      model: "gpt-4o-transcribe",   // or "gpt-4o-mini-transcribe"
      file: audio,
      response_format: "text",
      // prompt: "Chess terms: en passant, Sicilian Defense, Caro-Kann, castling"
    });

    return new Response(JSON.stringify({ text: result.text }), { status: 200 });
  } catch (err) {
    console.error("Transcribe error:", err);
    return new Response(JSON.stringify({ error: err.message ?? "Transcription failed" }), { status: 500 });
  }
}
