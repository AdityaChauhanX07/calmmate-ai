"use client";

import React, { useState, useRef } from "react";

interface RecorderProps {
  onAudioReady: (blob: Blob) => void;
  onRecordingStateChange?: (isRecording: boolean, stream: MediaStream | null) => void;
  disabled?: boolean;
}

export default function Recorder({ onAudioReady, onRecordingStateChange, disabled }: RecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);  // ✅ useRef instead of useState
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    chunksRef.current = [];  // ✅ reset chunks

    onRecordingStateChange?.(true, stream);

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);  // ✅ always up to date
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      onAudioReady(blob);

      // Stop all tracks
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      onRecordingStateChange?.(false, null);
    };

    recorder.start(100);  // ✅ collect data every 100ms
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center">
        {isRecording && (
          <span className="absolute inset-0 rounded-full bg-red-500/40 animate-ping" />
        )}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-colors shadow-lg
            ${isRecording ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
            disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-8 h-8">
            <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z" />
            <path d="M19 10a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.93V19H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-2.07A7 7 0 0 0 19 10z" />
          </svg>
        </button>
      </div>
      <p className="text-gray-400 text-sm">
        {disabled ? "Processing..." : isRecording ? "Recording..." : "Tap to record"}
      </p>
    </div>
  );
}