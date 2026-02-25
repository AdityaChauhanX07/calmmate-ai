import React, { useState } from "react";

interface RecorderProps {
  onAudioReady: (blob: Blob) => void;
  onRecordingStateChange?: (isRecording: boolean, stream: MediaStream | null) => void;   // ⭐ NEW
}

export default function Recorder({ onAudioReady, onRecordingStateChange }: RecorderProps) {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [chunks, setChunks] = useState<BlobPart[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);  // ⭐ NEW

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    setAudioStream(stream);                               // ⭐ Store stream
    onRecordingStateChange?.(true, stream);               // ⭐ Notify parent

    const recorder = new MediaRecorder(stream);
    setMediaRecorder(recorder);
    setChunks([]);

    recorder.ondataavailable = (e) => {
      setChunks((prev) => [...prev, e.data]);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      onAudioReady(blob);
    };

    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (!mediaRecorder) return;

    mediaRecorder.stop();
    setIsRecording(false);

    // ⭐ Stop the stream
    if (audioStream) {
      audioStream.getTracks().forEach((t) => t.stop());
      setAudioStream(null);
    }

    onRecordingStateChange?.(false, null);               // ⭐ Notify parent
  };

  return (
    <button
      onClick={isRecording ? stopRecording : startRecording}
      className={`px-6 py-3 rounded-lg font-semibold text-white transition ${
        isRecording ? "bg-red-600" : "bg-blue-600"
      }`}
    >
      {isRecording ? "Stop Recording" : "Start Recording"}
    </button>
  );
}
