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
    <button
      onClick={isRecording ? stopRecording : startRecording}
      disabled={disabled}
      className={`px-6 py-3 rounded-lg font-semibold text-white transition ${
        isRecording ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isRecording ? "Stop Recording" : "Start Recording"}
    </button>
  );
}