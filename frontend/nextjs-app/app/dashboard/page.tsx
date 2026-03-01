"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line,
} from "recharts";

const EMOTION_COLORS: Record<string, string> = {
  joy: "#4ade80",
  sadness: "#60a5fa",
  anger: "#f87171",
  fear: "#a78bfa",
  surprise: "#fbbf24",
  disgust: "#34d399",
  neutral: "#94a3b8",
};

const EMOTION_EMOJI: Record<string, string> = {
  joy: "😊",
  sadness: "😢",
  anger: "😠",
  fear: "😨",
  surprise: "😮",
  disgust: "🤢",
  neutral: "😐",
};

type EmotionCount = { emotion: string; count: number };
type EmotionSlot = { date: string; emotion: string; confidence: number | null };

interface AnalyticsData {
  emotionCounts: EmotionCount[];
  emotionOverTime: EmotionSlot[];
  averageConfidence: number;
  totalSessions: number;
  mostFrequentEmotion: string;
  streakDays: number;
}

function StatCard({
  icon, label, value, color,
}: {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-1">
      <span className="text-2xl">{icon}</span>
      <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      <span className="text-xl font-bold capitalize" style={{ color: color ?? "white" }}>{value}</span>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function EmotionDot(props: any) {
  const { cx, cy, payload } = props;
  if (payload.confidence === null) return null;
  const color = EMOTION_COLORS[payload.emotion] ?? "#60a5fa";
  return <circle cx={cx} cy={cy} r={5} fill={color} stroke="white" strokeWidth={1.5} />;
}

const TOOLTIP_CONTENT_STYLE = {
  backdropFilter: "blur(16px)",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "12px",
  color: "white",
  fontSize: "13px",
};

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/analytics")
      .then(res => {
        if (!res.ok) throw new Error("Failed to load analytics");
        return res.json();
      })
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [status]);

  return (
    <main className="relative min-h-screen bg-[#0a0f1f] overflow-hidden">
      <Navbar />
      {/* Background glow blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[160px] -top-40 -left-20" />
        <div className="absolute w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[150px] bottom-0 right-0" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white">
            Emotion <span className="text-blue-400">Dashboard</span>
          </h1>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/5 rounded-2xl h-24 border border-white/10" />
              ))}
            </div>
            <div className="bg-white/5 rounded-2xl h-64 border border-white/10" />
            <div className="bg-white/5 rounded-2xl h-64 border border-white/10" />
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
            <p className="text-3xl mb-2">⚠️</p>
            <p className="text-red-400 font-semibold">{error}</p>
            <p className="text-gray-500 text-sm mt-1">Try refreshing the page.</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && data && data.totalSessions === 0 && (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center animate-fadeIn">
            <p className="text-6xl mb-4">📊</p>
            <p className="text-white text-xl font-semibold mb-2">No data yet</p>
            <p className="text-gray-400 text-sm mb-2 max-w-xs mx-auto leading-relaxed">
              Your emotion trends, confidence scores, and session streaks will appear here once you start recording.
            </p>
            <p className="text-gray-500 text-xs mb-8">Charts unlock after your first session.</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 hover:bg-blue-500/30 transition text-sm"
            >
              Record your first session →
            </Link>
          </div>
        )}

        {/* Data state */}
        {!loading && !error && data && data.totalSessions > 0 && (
          <div className="space-y-6 animate-fadeIn">
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon="🎙️" label="Total Sessions" value={data.totalSessions} />
              <StatCard
                icon="💭"
                label="Top Emotion"
                value={data.mostFrequentEmotion}
                color={EMOTION_COLORS[data.mostFrequentEmotion] ?? "white"}
              />
              <StatCard
                icon="📊"
                label="Avg Confidence"
                value={`${Math.round(data.averageConfidence * 100)}%`}
                color="#60a5fa"
              />
              <StatCard
                icon="🔥"
                label="Day Streak"
                value={`${data.streakDays} day${data.streakDays !== 1 ? "s" : ""}`}
                color="#fbbf24"
              />
            </div>

            {/* Bar Chart — Emotion Distribution */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6">
              <h2 className="text-white font-semibold text-lg mb-4">Emotion Distribution</h2>
              {mounted ? (
                <div className="overflow-x-auto">
                  <div style={{ minWidth: "320px" }}>
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(180, data.emotionCounts.length * 52)}
                >
                  <BarChart
                    layout="vertical"
                    data={data.emotionCounts}
                    margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <YAxis
                      type="category"
                      dataKey="emotion"
                      width={110}
                      tick={{ fill: "#94a3b8", fontSize: 13 }}
                      tickFormatter={e => `${EMOTION_EMOJI[e] ?? "•"} ${e}`}
                    />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_CONTENT_STYLE}
                      itemStyle={{ color: "#e2e8f0" }}
                      labelStyle={{ color: "#94a3b8", marginBottom: 4 }}
                      cursor={{ fill: "rgba(255,255,255,0.04)" }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => [value, "sessions"] as any}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      labelFormatter={(e: any) => `${EMOTION_EMOJI[e as string] ?? "•"} ${e}` as any}
                    />
                    <Bar dataKey="count" maxBarSize={36} radius={[0, 6, 6, 0]}>
                      {data.emotionCounts.map(entry => (
                        <Cell
                          key={entry.emotion}
                          fill={EMOTION_COLORS[entry.emotion] ?? "#60a5fa"}
                          fillOpacity={0.85}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div
                  className="animate-pulse bg-white/5 rounded-xl"
                  style={{ height: Math.max(180, data.emotionCounts.length * 52) }}
                />
              )}
            </div>

            {/* Line Chart — Confidence Over Time */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6">
              <h2 className="text-white font-semibold text-lg mb-4">
                Confidence Over Time{" "}
                <span className="text-gray-500 text-sm font-normal">(last 14 days)</span>
              </h2>
              {mounted ? (
                <div className="overflow-x-auto">
                  <div style={{ minWidth: "320px" }}>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart
                    data={data.emotionOverTime}
                    margin={{ top: 8, right: 16, bottom: 4, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDateLabel}
                      interval={1}
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                    />
                    <YAxis
                      domain={[0, 1]}
                      tickFormatter={v => `${Math.round(v * 100)}%`}
                      width={42}
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_CONTENT_STYLE}
                      itemStyle={{ color: "#e2e8f0" }}
                      labelStyle={{ color: "#94a3b8", marginBottom: 4 }}
                      cursor={{ stroke: "rgba(255,255,255,0.1)" }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any, _: any, props: any) => {
                        if (value === null || value === undefined) return ["—", "Confidence"] as any;
                        const e = props.payload?.emotion;
                        return [
                          `${Math.round(value * 100)}%`,
                          e ? `${EMOTION_EMOJI[e] ?? "•"} ${e}` : "Confidence",
                        ] as any;
                      }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      labelFormatter={(label: any) => formatDateLabel(label) as any}
                    />
                    <Line
                      type="monotone"
                      dataKey="confidence"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      connectNulls={false}
                      dot={<EmotionDot />}
                      activeDot={{ r: 7, fill: "#60a5fa", stroke: "white", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="animate-pulse bg-white/5 rounded-xl" style={{ height: 220 }} />
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
