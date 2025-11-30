"use client";
import { useRef, useState } from "react";

export default function VoiceToText() {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");

  async function start() {
    setError(""); setTranscript("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/webm";
      const mr = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data?.size && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        stream.getTracks().forEach((t) => t.stop());
        await sendToServer(blob, mime);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      setError("Mic permission denied or unsupported browser.");
    }
  }

  function stop() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  }

  async function sendToServer(blob, mime) {
    setLoading(true);
    try {
      const ext = mime.includes("mp4") ? "m4a" : "webm";
      const file = new File([blob], `speech.${ext}`, { type: mime });
      const form = new FormData();
      form.append("audio", file);
      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transcription failed");
      setTranscript(data.text || "");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-2xl border p-6 shadow-sm">
      <h2 className="text-2xl font-semibold">Speak to Text</h2>
      <p className="mt-1 text-sm text-gray-500">Record your chess notes and convert to text.</p>

      <div className="mt-4 flex items-center gap-3">
        {!recording ? (
          <button onClick={start} className="rounded-xl bg-black px-4 py-2 text-white hover:opacity-90">
            🎙️ Start
          </button>
        ) : (
          <button onClick={stop} className="rounded-xl bg-red-600 px-4 py-2 text-white hover:opacity-90">
            ⏹ Stop
          </button>
        )}
        {loading && <span className="text-sm text-gray-600">Transcribing…</span>}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {transcript && (
        <div className="mt-4 rounded-lg bg-gray-50 p-4">
          <h3 className="font-medium">Transcript</h3>
          <p className="mt-2 whitespace-pre-wrap">{transcript}</p>
        </div>
      )}
    </div>
  );
}
