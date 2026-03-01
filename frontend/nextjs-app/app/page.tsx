"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Recorder from "../components/Recorder";
import Waveform from "../components/Waveform";
import Navbar from "@/components/Navbar";
import AudioPlayer from "@/components/AudioPlayer";

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

const EMOTION_COLORS: Record<string, string> = {
  joy: '#4ade80', sadness: '#60a5fa', anger: '#f87171',
  fear: '#a78bfa', surprise: '#fbbf24', disgust: '#34d399', neutral: '#94a3b8',
};
const EMOTION_EMOJI: Record<string, string> = {
  joy: '😊', sadness: '😢', anger: '😠',
  fear: '😨', surprise: '😲', disgust: '🤢', neutral: '😐',
};

function EmotionPill({ emotion }: { emotion: string }) {
  const color = EMOTION_COLORS[emotion.toLowerCase()] ?? '#94a3b8';
  const emoji = EMOTION_EMOJI[emotion.toLowerCase()] ?? '•';
  return (
    <span className="inline-flex items-center gap-2 text-[14px] font-medium capitalize"
      style={{
        padding: '6px 16px', borderRadius: 100,
        background: `${color}1f`, border: `1px solid ${color}33`,
        color,
      }}>
      {emoji} {emotion}
    </span>
  );
}

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

  if (status === "loading") return (
    <main className="min-h-screen flex items-center justify-center">
      <Navbar />
      <div className="card animate-pulse max-w-xl w-full mx-4" style={{ marginTop: 80 }}>
        <div className="h-3 rounded w-32 mb-6" style={{ background: 'var(--border)' }} />
        <div className="h-10 rounded w-3/4 mb-3" style={{ background: 'var(--border)' }} />
        <div className="h-4 rounded w-1/2 mb-12" style={{ background: 'var(--border)' }} />
        <div className="h-36 rounded-2xl" style={{ background: 'var(--border)' }} />
      </div>
    </main>
  );

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
    } catch (e: unknown) {
      handleError((e as Error).message || "Something went wrong. Please try again.");
    }
  };

  const isProcessing = ["uploading", "analyzing", "speaking"].includes(appState);

  return (
    <main className="min-h-screen">
      <Navbar />

      {/* ── Upper section: full-height centered ── */}
      <div className="flex flex-col items-center justify-center px-4"
        style={{ minHeight: 'calc(100vh - 64px)' }}>

        {/* Hero — text-center */}
        <div className="text-center max-w-2xl w-full animate-fadeIn" style={{ marginBottom: 48 }}>
          <p className="text-[11px] uppercase tracking-[0.2em] mb-4" style={{ color: 'var(--accent)' }}>
            Your emotional companion
          </p>
          <h1 className="font-fraunces mb-4" style={{ fontSize: 'clamp(40px,6vw,64px)', fontWeight: 300, letterSpacing: '-0.02em', lineHeight: 1.1, color: 'var(--text)' }}>
            How are you{' '}
            <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>feeling</em>{' '}
            today?
          </h1>
          <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.7 }}>
            Speak freely. I&apos;ll listen, understand, and respond with care.
          </p>
        </div>

        {/* Recorder — standalone, no card wrapper */}
        <Recorder
          onAudioReady={handleAudioReady}
          onRecordingStateChange={(rec, stream) => { setAudioStream(stream); if (rec) resetState(); }}
          disabled={isProcessing}
        />
        <Waveform audioStream={audioStream} isRecording={appState === "recording"} />

        {/* Status / error inline */}
        {(isProcessing || appState === "error") && (
          <p className="text-[13px] mt-4 tracking-[0.04em]" style={{ color: appState === "error" ? '#f87171' : 'var(--muted)' }}>
            {errorMessage || STATUS_MESSAGES[appState]}
          </p>
        )}
      </div>

      {/* ── Results section ── */}
      <div className="max-w-[640px] mx-auto px-4 pb-16">

        {audioURL && (
          <div className="card mb-4 animate-fadeIn" style={{ opacity: 0, animationFillMode: 'both' }}>
            <p className="text-[11px] uppercase tracking-[0.15em] mb-4" style={{ color: 'var(--muted)' }}>Your recording</p>
            <AudioPlayer src={audioURL} />
          </div>
        )}

        {transcript && (
          <div className="card mb-4 animate-fadeIn" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'both' }}>
            <p className="text-[11px] uppercase tracking-[0.15em] mb-3" style={{ color: 'var(--muted)' }}>Transcript</p>
            <p style={{ color: 'var(--text)', lineHeight: 1.7 }}>{transcript}</p>
          </div>
        )}

        {emotion && (
          <div className="card mb-4 animate-fadeIn" style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'both' }}>
            <p className="text-[11px] uppercase tracking-[0.15em] mb-3" style={{ color: 'var(--muted)' }}>Emotion detected</p>
            <EmotionPill emotion={emotion} />
            <div className="mt-4">
              <div className="flex justify-between text-[12px] mb-1" style={{ color: 'var(--muted)' }}>
                <span>Confidence</span>
                <span>{(confidence! * 100).toFixed(1)}%</span>
              </div>
              <div className="rounded-full overflow-hidden" style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${(confidence! * 100).toFixed(1)}%`, background: 'linear-gradient(90deg, var(--accent), #4a9ab8)' }} />
              </div>
            </div>
          </div>
        )}

        {aiReply && (
          <div className="card mb-4 animate-fadeIn"
            style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'both', borderColor: 'rgba(126,184,212,0.15)' }}>
            <p className="text-[11px] uppercase tracking-[0.15em] mb-3" style={{ color: 'var(--accent)', opacity: 0.7 }}>CalmMate</p>
            <p style={{ color: 'var(--text)', lineHeight: 1.7 }}>{aiReply}</p>
          </div>
        )}

        {voiceUrl && (
          <div className="card mb-4 animate-fadeIn" style={{ animationDelay: '0.4s', opacity: 0, animationFillMode: 'both' }}>
            <p className="text-[11px] uppercase tracking-[0.15em] mb-4" style={{ color: 'var(--muted)' }}>AI Voice Response</p>
            <AudioPlayer src={voiceUrl} autoPlay />
          </div>
        )}

        {(appState === "done" || appState === "error") && (
          <button
            onClick={resetState}
            className="w-full py-3 text-[13px] tracking-[0.04em] transition-colors mt-2"
            style={{ border: '1px solid var(--border)', borderRadius: 100, color: 'var(--muted)', background: 'none', cursor: 'pointer' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'; }}
          >
            Start a new session
          </button>
        )}
      </div>
    </main>
  );
}
