import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const EMOTION_COLORS: Record<string, string> = {
  joy: "#4ade80",
  sadness: "#60a5fa",
  anger: "#f87171",
  fear: "#a78bfa",
  surprise: "#fbbf24",
  disgust: "#34d399",
  neutral: "#94a3b8",
};

const EMOTION_EMOJIS: Record<string, string> = {
  joy: "😊",
  sadness: "😢",
  anger: "😠",
  fear: "😨",
  surprise: "😲",
  disgust: "🤢",
  neutral: "😐",
};

function EmotionPill({
  emotion,
  confidence,
}: {
  emotion: string;
  confidence: number;
}) {
  const key = emotion.toLowerCase();
  const color = EMOTION_COLORS[key] ?? "#94a3b8";
  const emoji = EMOTION_EMOJIS[key] ?? "•";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 14px",
        borderRadius: 100,
        fontSize: 13,
        background: `${color}1f`,
        border: `1px solid ${color}33`,
        color,
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      <span>{emoji}</span>
      <span style={{ textTransform: "capitalize" }}>{emotion}</span>
      <span style={{ opacity: 0.6, fontSize: 11 }}>
        · {(confidence * 100).toFixed(0)}%
      </span>
    </span>
  );
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const sessions = await prisma.sessionData.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      transcript: true,
      emotion: true,
      confidence: true,
      reply: true,
      createdAt: true,
    },
  });

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-16">

        {/* Page header */}
        <div className="mb-10 animate-fadeIn">
          <h1
            className="font-fraunces mb-2"
            style={{ fontSize: 40, fontWeight: 300, color: "var(--text)" }}
          >
            Session{" "}
            <em style={{ color: "var(--accent)", fontStyle: "italic" }}>
              History
            </em>
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Your emotional journey over time
          </p>
        </div>

        {sessions.length === 0 ? (
          <div className="card text-center py-16 animate-fadeIn">
            <p className="text-5xl mb-4">🧘</p>
            <p
              className="font-fraunces text-[22px] mb-2"
              style={{ color: "var(--text)", fontWeight: 300 }}
            >
              Your journey starts here
            </p>
            <p
              className="text-[14px] mb-2 max-w-xs mx-auto"
              style={{ color: "var(--muted)", lineHeight: 1.6 }}
            >
              Each conversation will be saved here so you can track your
              emotional patterns over time.
            </p>
            <p
              className="text-[12px] mb-8"
              style={{ color: "var(--muted)", opacity: 0.5 }}
            >
              No sessions recorded yet.
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
              Start your first session →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((s, i) => (
              <article
                key={s.id}
                className="card animate-fadeIn"
                style={{
                  animationDelay: `${i * 0.05}s`,
                  opacity: 0,
                  animationFillMode: "both",
                }}
              >
                {/* Top row: emotion pill + date */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <EmotionPill
                    emotion={s.emotion}
                    confidence={s.confidence}
                  />
                  <div className="text-right">
                    <p
                      className="text-[11px] uppercase tracking-[0.08em]"
                      style={{ color: "var(--muted)" }}
                    >
                      {formatDate(s.createdAt)}
                    </p>
                    <p
                      className="text-[11px]"
                      style={{ color: "var(--muted)", opacity: 0.6 }}
                    >
                      {formatTime(s.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Transcript */}
                <p
                  className="text-[14px] italic mb-4 line-clamp-3"
                  style={{ color: "var(--muted)", lineHeight: 1.6 }}
                >
                  &ldquo;{s.transcript}&rdquo;
                </p>

                {/* Divider */}
                <div
                  className="mb-4"
                  style={{ height: 1, background: "var(--border)" }}
                />

                {/* AI Reply */}
                <p
                  className="text-[10px] uppercase tracking-[0.15em] mb-2"
                  style={{ color: "var(--accent)", opacity: 0.7 }}
                >
                  CalmMate responded
                </p>
                <p
                  className="text-[14px] line-clamp-4"
                  style={{ color: "var(--text)", lineHeight: 1.6 }}
                >
                  {s.reply}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
