"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

// Build a smooth cubic bezier SVG path through a list of points.
// Control points are placed at 1/3 of the horizontal distance from each side.
function buildSmoothPath(
  pts: { x: number; y: number }[]
): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1].x - pts[i].x;
    const cp1x = (pts[i].x + dx / 3).toFixed(1);
    const cp2x = (pts[i + 1].x - dx / 3).toFixed(1);
    d += ` C ${cp1x} ${pts[i].y.toFixed(1)}, ${cp2x} ${pts[i + 1].y.toFixed(1)}, ${pts[i + 1].x.toFixed(1)} ${pts[i + 1].y.toFixed(1)}`;
  }
  return d;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  valueColor,
  smallValue,
}: {
  label: string;
  value: string | number;
  valueColor?: string;
  smallValue?: boolean;
}) {
  return (
    <div className="card" style={{ padding: "20px 24px" }}>
      <p
        style={{
          fontSize: 10,
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: 10,
        }}
      >
        {label}
      </p>
      <p
        className="font-fraunces"
        style={{
          fontSize: smallValue ? 28 : 36,
          color: valueColor ?? "var(--text)",
          fontWeight: 300,
          lineHeight: 1,
          textTransform: "capitalize",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function EmotionDistributionChart({ data }: { data: EmotionCount[] }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="card">
      <p
        style={{
          fontSize: 10,
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: 20,
        }}
      >
        Emotion Distribution
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {data.map(({ emotion, count }) => {
          const color = EMOTION_COLORS[emotion] ?? "#94a3b8";
          const emoji = EMOTION_EMOJI[emotion] ?? "•";
          const pct = ready ? `${(count / max) * 100}%` : "0%";
          return (
            <div
              key={emotion}
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              {/* Emotion label — 70px, right-aligned */}
              <div
                style={{
                  width: 70,
                  textAlign: "right",
                  fontSize: 12,
                  color: "var(--muted)",
                  flexShrink: 0,
                  textTransform: "capitalize",
                }}
              >
                {emoji} {emotion}
              </div>

              {/* Track */}
              <div
                style={{
                  flex: 1,
                  height: 8,
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 4,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    width: pct,
                    background: color,
                    borderRadius: 4,
                    opacity: 0.85,
                    transition: "width 1s ease",
                  }}
                />
              </div>

              {/* Count */}
              <div
                style={{
                  width: 24,
                  textAlign: "right",
                  fontSize: 12,
                  color: "var(--muted)",
                  flexShrink: 0,
                }}
              >
                {count}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConfidenceChart({ data }: { data: EmotionSlot[] }) {
  // SVG dimensions
  const W = 800;
  const H = 160;
  const PAD = { l: 10, r: 15, t: 15, b: 35 };
  const cW = W - PAD.l - PAD.r; // chart width
  const cH = H - PAD.t - PAD.b; // chart height (= 110)
  const yBottom = PAD.t + cH; // y-coordinate for confidence = 0

  const xOf = (i: number) =>
    data.length > 1
      ? PAD.l + (i / (data.length - 1)) * cW
      : PAD.l + cW / 2;

  const yOf = (conf: number) => PAD.t + (1 - conf) * cH;

  // Group consecutive non-null points into segments
  type Pt = { x: number; y: number; emotion: string; confidence: number };
  const segments: Pt[][] = [];
  let seg: Pt[] = [];

  data.forEach((d, i) => {
    if (d.confidence !== null) {
      seg.push({
        x: xOf(i),
        y: yOf(d.confidence),
        emotion: d.emotion,
        confidence: d.confidence,
      });
    } else if (seg.length > 0) {
      segments.push(seg);
      seg = [];
    }
  });
  if (seg.length > 0) segments.push(seg);

  const allDots = segments.flat();

  // Build line + area paths
  const lineParts = segments.map((s) => buildSmoothPath(s)).join(" ");
  const areaParts = segments
    .map((s) => {
      if (s.length < 2) return "";
      return `${buildSmoothPath(s)} L ${s[s.length - 1].x.toFixed(1)} ${yBottom} L ${s[0].x.toFixed(1)} ${yBottom} Z`;
    })
    .filter(Boolean)
    .join(" ");

  return (
    <div className="card">
      <p
        style={{
          fontSize: 10,
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: 16,
        }}
      >
        Confidence Over Time{" "}
        <span style={{ opacity: 0.5, fontSize: 10 }}>(last 14 days)</span>
      </p>
      <div style={{ overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height="200"
          preserveAspectRatio="none"
          style={{ display: "block" }}
        >
          <defs>
            <linearGradient
              id="conf-area-grad"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#7eb8d4" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#7eb8d4" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[40, 80, 120].map((y) => (
            <line
              key={y}
              x1={PAD.l}
              y1={y}
              x2={W - PAD.r}
              y2={y}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth={1}
            />
          ))}

          {/* Area fill */}
          {areaParts && (
            <path d={areaParts} fill="url(#conf-area-grad)" />
          )}

          {/* Line */}
          {lineParts && (
            <path
              d={lineParts}
              fill="none"
              stroke="#7eb8d4"
              strokeWidth={1.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {/* Data dots — colored by emotion */}
          {allDots.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={4}
              fill={EMOTION_COLORS[p.emotion] ?? "#94a3b8"}
              stroke="rgba(7,9,15,0.6)"
              strokeWidth={1.5}
            />
          ))}

          {/* X-axis date labels — every other index to avoid crowding */}
          {data.map((d, i) => {
            if (i % 2 !== 0 && i !== data.length - 1) return null;
            return (
              <text
                key={i}
                x={xOf(i)}
                y={H - 6}
                textAnchor="middle"
                fill="rgba(232,230,225,0.45)"
                fontSize={10}
              >
                {formatDateLabel(d.date)}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6" style={{ animation: "pulse 2s ease-in-out infinite" }}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="card"
            style={{ height: 96, background: "var(--border)" }}
          />
        ))}
      </div>
      <div
        className="card"
        style={{ height: 240, background: "var(--border)" }}
      />
      <div
        className="card"
        style={{ height: 200, background: "var(--border)" }}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/analytics")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load analytics");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [status]);

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-12">

        {/* Header */}
        <div className="mb-10 animate-fadeIn">
          <h1
            className="font-fraunces mb-2"
            style={{ fontSize: 40, fontWeight: 300, color: "var(--text)" }}
          >
            Emotion{" "}
            <em style={{ color: "var(--accent)", fontStyle: "italic" }}>
              Dashboard
            </em>
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Your emotional patterns at a glance
          </p>
        </div>

        {/* Loading */}
        {loading && <LoadingSkeleton />}

        {/* Error */}
        {!loading && error && (
          <div
            className="card text-center py-12"
            style={{ borderColor: "rgba(248,113,113,0.2)" }}
          >
            <p className="text-3xl mb-3">⚠️</p>
            <p style={{ color: "#f87171", fontWeight: 500, marginBottom: 4 }}>
              {error}
            </p>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>
              Try refreshing the page.
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && data && data.totalSessions === 0 && (
          <div className="card text-center py-16 animate-fadeIn">
            <p className="text-5xl mb-4">📊</p>
            <p
              className="font-fraunces text-[22px] mb-2"
              style={{ color: "var(--text)", fontWeight: 300 }}
            >
              No data yet
            </p>
            <p
              className="text-[14px] mb-2 max-w-xs mx-auto"
              style={{ color: "var(--muted)", lineHeight: 1.6 }}
            >
              Your emotion trends, confidence scores, and session streaks will
              appear here once you start recording.
            </p>
            <p
              className="text-[12px] mb-8"
              style={{ color: "var(--muted)", opacity: 0.5 }}
            >
              Charts unlock after your first session.
            </p>
            <Link
              href="/"
              className="inline-block text-[13px] transition-colors"
              style={{
                padding: "10px 24px",
                borderRadius: 100,
                border: "1px solid rgba(126,184,212,0.3)",
                color: "var(--accent)",
                textDecoration: "none",
              }}
            >
              Record your first session →
            </Link>
          </div>
        )}

        {/* Data */}
        {!loading && !error && data && data.totalSessions > 0 && (
          <div className="space-y-6 animate-fadeIn">

            {/* Stats row — 4 cols, 2x2 on mobile */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Total Sessions"
                value={data.totalSessions}
              />
              <StatCard
                label="Top Emotion"
                value={data.mostFrequentEmotion}
                valueColor="var(--accent)"
                smallValue
              />
              <StatCard
                label="Avg Confidence"
                value={`${Math.round(data.averageConfidence * 100)}%`}
              />
              <StatCard
                label="Day Streak"
                value={`${data.streakDays}d`}
                valueColor="var(--accent-warm)"
              />
            </div>

            {/* Emotion distribution — CSS horizontal bar chart */}
            <EmotionDistributionChart data={data.emotionCounts} />

            {/* Confidence over time — custom SVG */}
            <ConfidenceChart data={data.emotionOverTime} />
          </div>
        )}
      </div>
    </main>
  );
}
