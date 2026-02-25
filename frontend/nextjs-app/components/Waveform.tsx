"use client";

import { useEffect, useRef } from "react";

interface WaveformProps {
  audioStream: MediaStream | null;
  isRecording: boolean;
}

export default function Waveform({ audioStream, isRecording }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (!audioStream || !isRecording) return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(audioStream);

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;

    source.connect(analyser);

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    function draw() {
    if (!analyserRef.current || !dataArrayRef.current) return;

    const arr = dataArrayRef.current; // TS-safe
    (analyserRef.current as any).getByteFrequencyData(arr);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * 1.5;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const value = arr[i];
        const barHeight = (value / 255) * canvas.height;

        ctx.fillStyle = "#4f9cff";
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
    }

    requestAnimationFrame(draw);
    }

    draw();

    return () => {
      audioContext.close();
    };
  }, [audioStream, isRecording]);

  if (!isRecording) {
    return (
      <div className="text-gray-500 text-sm mt-3 italic">
        (Waveform appears when recording...)
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={80}
      className="mt-4 w-full h-20 rounded-lg bg-black/20 border border-white/20"
    />
  );
}
