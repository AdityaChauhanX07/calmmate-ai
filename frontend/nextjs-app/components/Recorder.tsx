"use client";

import React, { useState, useRef } from "react";

interface RecorderProps {
  onAudioReady: (blob: Blob) => void;
  onRecordingStateChange?: (isRecording: boolean, stream: MediaStream | null) => void;
  disabled?: boolean;
}

const RINGS = [
  { size: 156, opacity: 0.05, delay: '1s',  animClass: 'animate-breathe-3' },
  { size: 130, opacity: 0.10, delay: '0.5s', animClass: 'animate-breathe-2' },
  { size: 108, opacity: 0.20, delay: '0s',  animClass: 'animate-breathe-1' },
];

export default function Recorder({ onAudioReady, onRecordingStateChange, disabled }: RecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    chunksRef.current = [];

    onRecordingStateChange?.(true, stream);

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      onAudioReady(blob);

      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      onRecordingStateChange?.(false, null);
    };

    recorder.start(100);
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
        {/* Concentric rings */}
        {RINGS.map(({ size, opacity, delay, animClass }) => (
          <div
            key={size}
            className={`absolute rounded-full ${isRecording ? '' : animClass}`}
            style={{
              width: size, height: size,
              border: `1px solid rgba(126,184,212,${isRecording ? opacity * 2 : opacity})`,
              animation: isRecording
                ? `ring-pulse 1.5s ease-in-out ${delay} infinite`
                : undefined,
            }}
          />
        ))}
        {/* Main button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled}
          className="relative rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            width: 88, height: 88,
            background: isRecording
              ? 'linear-gradient(145deg, #4a1a1a, #2a0f0f)'
              : 'linear-gradient(145deg, #1a3a52, #0f2233)',
            border: `1px solid ${isRecording ? 'rgba(248,113,113,0.4)' : 'rgba(126,184,212,0.3)'}`,
            boxShadow: isRecording
              ? '0 0 40px rgba(248,113,113,0.2), 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)'
              : '0 0 40px rgba(126,184,212,0.12), 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
            transform: 'scale(1)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
        >
          {/* Mic SVG — stroke style */}
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
            stroke={isRecording ? '#f87171' : 'var(--accent)'}
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="2" width="6" height="11" rx="3"/>
            <path d="M5 10a7 7 0 0 0 14 0"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
          </svg>
        </button>
      </div>
      {/* Status text */}
      <p className="text-[13px] tracking-[0.04em]" style={{ color: 'var(--muted)' }}>
        {disabled ? (
          <span className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse-dot" />
            Processing...
          </span>
        ) : isRecording ? (
          <span className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse-dot" />
            Recording...
          </span>
        ) : "Tap to begin"}
      </p>
    </div>
  );
}
