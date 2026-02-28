"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Recorder from "../components/Recorder";
import Waveform from "../components/Waveform";

type AppState = "idle" | "recording" | "uploading" | "analyzing" | "speaking" | "done" | "error";

const STATUS_MESSAGES: Record<AppState, string> = {
  idle: "Tap to speak your thoughts.",
  recording: "Listening...",
  uploading: "Uploading your audio...",
  analyzing: "Analyzing your emotions...",
  speaking: "Generating voice response...",
  done: "Here's what I heard.",
  error: "Something went wrong. Please try again.",
};

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [appState, setAppState] = useState<AppState>("idle");
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [emotion, setEmotion] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <main className="min-h-screen w-full flex items-center justify-center bg-[#0a0f1f]">
        <div className="text-white text-xl">Loading...</div>
      </main>
    );
  }

  const resetState = () => {
    setTranscript(null);
    setEmotion(null);
    setConfidence(null);
    setAiReply(null);
    setVoiceUrl(null);
    setAudioURL(null);
    setErrorMessage(null);
    setAppState("idle");
  };

  const handleError = (msg: string) => {
    setErrorMessage(msg);
    setAppState("error");
  };

  const saveSession = async (data: {
    transcript: string;
    emotion: string;
    confidence: number;
    reply: string;
  }) => {
    try {
      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {
      console.error("Failed to save session history");
    }
  };

  const requestVoiceReply = async (text: string) => {
    setAppState("speaking");
    const res = await fetch(`${API_BASE}/speak`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error("Voice generation failed");
    const data = await res.json();
    if (!data.file_id) throw new Error("No voice file returned");
    setVoiceUrl(`${API_BASE}/voice_replies/${data.file_id}.mp3`);
    setAppState("done");
  };

  const analyzeAudio = async (id: string) => {
    setAppState("analyzing");
    const res = await fetch(`${API_BASE}/analyze_audio/${id}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Analysis failed");
    }
    const data = await res.json();
    setTranscript(data.transcript);
    setEmotion(data.emotion);
    setConfidence(data.confidence);
    setAiReply(data.reply);
    // Save session in background — non-blocking, failure is non-fatal
    saveSession({
      transcript: data.transcript,
      emotion: data.emotion,
      confidence: data.confidence,
      reply: data.reply,
    });
    await requestVoiceReply(data.reply);
  };

  const uploadAudio = async (blob: Blob) => {
    setAppState("uploading");
    const formData = new FormData();
    formData.append("file", blob, "recording.webm");
    const res = await fetch(`${API_BASE}/upload_audio`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    if (!data.file_id) throw new Error("No file ID returned");
    await analyzeAudio(data.file_id);
  };

  const handleAudioReady = async (blob: Blob) => {
    setAudioURL(URL.createObjectURL(blob));
    try {
      await uploadAudio(blob);
    } catch (e: any) {
      handleError(e.message || "Something went wrong. Please try again.");
    }
  };

  const isProcessing = ["uploading", "analyzing", "speaking"].includes(appState);

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center bg-[#0a0f1f] overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[160px] -top-40 -left-20" />
        <div className="absolute w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[150px] bottom-0 right-0" />
      </div>

      <div className="backdrop-blur-2xl bg-white/5 border border-white/10 shadow-2xl rounded-3xl px-12 py-10 max-w-2xl w-full">

        <div className="flex justify-between items-center mb-2">
          <h1 className="text-5xl font-extrabold text-white">
            CalmMate <span className="text-blue-400">AI</span>
          </h1>
          <div className="flex items-center gap-4">
            <Link
              href="/history"
              className="text-gray-400 hover:text-blue-300 text-sm transition-colors"
            >
              View History
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="text-gray-500 hover:text-white text-sm transition"
            >
              Sign out
            </button>
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-1">
          Welcome back, <span className="text-blue-400">{session?.user?.name || session?.user?.email}</span>
        </p>

        <p className="text-gray-300 text-center mb-8">
          Your personal AI voice companion for emotional clarity.
        </p>

        <div className="bg-white/10 p-6 rounded-2xl border border-white/20 shadow-xl flex flex-col items-center">
          <Recorder
            onAudioReady={handleAudioReady}
            onRecordingStateChange={(rec, stream) => {
              setAudioStream(stream);
              if (rec) resetState();
            }}
            disabled={isProcessing}
          />
          <Waveform audioStream={audioStream} isRecording={appState === "recording"} />
          <p className={`text-sm mt-3 transition-all ${appState === "error" ? "text-red-400" : "text-gray-400"}`}>
            {isProcessing && (
              <span className="inline-block w-3 h-3 rounded-full bg-blue-400 animate-pulse mr-2" />
            )}
            {errorMessage || STATUS_MESSAGES[appState]}
          </p>
        </div>

        {audioURL && (
          <audio controls src={audioURL} className="mt-6 w-full rounded-lg" />
        )}

        {transcript && (
          <div className="mt-8 bg-white/10 p-6 rounded-xl border border-white/20 text-gray-200">
            <h2 className="text-xl text-blue-300 mb-2">📝 Transcript</h2>
            <p>{transcript}</p>
          </div>
        )}

        {emotion && (
          <div className="mt-6 bg-white/10 p-6 rounded-xl border border-white/20 text-gray-200">
            <h2 className="text-xl text-blue-300 mb-2">💬 Emotion Analysis</h2>
            <p>Emotion: <strong className="capitalize">{emotion}</strong></p>
            <p>Confidence: <strong>{(confidence! * 100).toFixed(1)}%</strong></p>
          </div>
        )}

        {aiReply && (
          <div className="mt-6 bg-white/10 p-6 rounded-xl border border-white/20 text-gray-200">
            <h2 className="text-xl text-blue-300 mb-2">🧠 AI Therapist</h2>
            <p>{aiReply}</p>
          </div>
        )}

        {voiceUrl && (
          <div className="mt-6 bg-white/10 p-6 rounded-xl border border-white/20">
            <h2 className="text-xl text-blue-300 mb-2">🔊 AI Voice Response</h2>
            <audio controls src={voiceUrl} className="w-full" autoPlay />
          </div>
        )}

        {(appState === "done" || appState === "error") && (
          <button
            onClick={resetState}
            className="mt-6 w-full py-3 rounded-xl border border-white/20 text-gray-300 hover:bg-white/10 transition text-sm"
          >
            Start a new session
          </button>
        )}

      </div>
    </main>
  );
}