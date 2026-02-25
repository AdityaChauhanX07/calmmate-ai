"use client";

import { useState } from "react";
import Recorder from "../components/Recorder";
import Waveform from "../components/Waveform";

export default function Home() {
  // Recording states
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  // Analysis states
  const [transcript, setTranscript] = useState<string | null>(null);
  const [emotion, setEmotion] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [aiReply, setAiReply] = useState<string | null>(null);

  // Voice output
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);

  // ================================
  //  Speak API → get Voice MP3
  // ================================
  const requestVoiceReply = async (text: string) => {
    const res = await fetch("http://127.0.0.1:8000/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();
    if (!data.file_id) return;

    const url = `http://127.0.0.1:8000/voice_replies/${data.file_id}.mp3`;
    setVoiceUrl(url);
  };

  // ================================
  // Analyze uploaded audio
  // ================================
  const analyzeAudio = async (id: string) => {
    const res = await fetch(`http://127.0.0.1:8000/analyze_audio/${id}`);
    const data = await res.json();

    setTranscript(data.transcript);
    setEmotion(data.emotion);
    setConfidence(data.confidence);
    setAiReply(data.reply);

    // Auto-trigger speech output
    await requestVoiceReply(data.reply);
  };

  // ================================
  // Upload audio file
  // ================================
  const uploadAudio = async (blob: Blob) => {
    const formData = new FormData();
    formData.append("file", blob, "recording.webm");

    const res = await fetch("http://127.0.0.1:8000/upload_audio", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.file_id) {
      await analyzeAudio(data.file_id);
    }
  };

  // ================================
  // Recorder callback
  // ================================
  const handleAudioReady = async (blob: Blob) => {
    setAudioURL(URL.createObjectURL(blob));
    await uploadAudio(blob);
  };

  // ================================
  // UI
  // ================================
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center bg-[#0a0f1f] overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[160px] -top-40 -left-20"></div>
        <div className="absolute w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[150px] bottom-0 right-0"></div>
      </div>

      <div className="backdrop-blur-2xl bg-white/5 border border-white/10 shadow-2xl rounded-3xl px-12 py-10 max-w-2xl w-full animate-fadeIn">
        
        <h1 className="text-5xl font-extrabold text-white text-center mb-4">
          CalmMate <span className="text-blue-400">AI</span>
        </h1>

        <p className="text-gray-300 text-center mb-8">
          Your personal AI voice companion for emotional clarity.
        </p>

        {/* Recorder */}
        <div className="bg-white/10 p-6 rounded-2xl border border-white/20 shadow-xl flex flex-col items-center">
          <Recorder
            onAudioReady={handleAudioReady}
            onRecordingStateChange={(rec, stream) => {
              setIsRecording(rec);
              setAudioStream(stream);
            }}
          />

          <Waveform audioStream={audioStream} isRecording={isRecording} />

          <p className="text-gray-400 text-sm mt-3">Tap to speak your thoughts.</p>
        </div>

        {/* Replay user's audio */}
        {audioURL && (
          <audio controls src={audioURL} className="mt-6 w-full rounded-lg" />
        )}

        {/* Transcript */}
        {transcript && (
          <div className="mt-8 bg-white/10 p-6 rounded-xl border border-white/20 text-gray-200 animate-fadeIn">
            <h2 className="text-xl text-blue-300 mb-2">📝 Transcript</h2>
            {transcript}
          </div>
        )}

        {/* Emotion */}
        {emotion && (
          <div className="mt-6 bg-white/10 p-6 rounded-xl border border-white/20 text-gray-200 animate-fadeIn">
            <h2 className="text-xl text-blue-300 mb-2">💬 Emotion Analysis</h2>
            Emotion: <strong>{emotion}</strong> <br />
            Confidence: {(confidence! * 100).toFixed(1)}%
          </div>
        )}

        {/* Therapist Reply (text) */}
        {aiReply && (
          <div className="mt-6 bg-white/10 p-6 rounded-xl border border-white/20 text-gray-200 animate-fadeIn">
            <h2 className="text-xl text-blue-300 mb-2">🧠 AI Therapist</h2>
            {aiReply}
          </div>
        )}

        {/* Voice Reply */}
        {voiceUrl && (
          <div className="mt-6 bg-white/10 p-6 rounded-xl border border-white/20 animate-fadeIn">
            <h2 className="text-xl text-blue-300 mb-2">🔊 AI Voice Response</h2>
            <audio controls src={voiceUrl} className="w-full" />
          </div>
        )}

      </div>
    </main>
  );
}
