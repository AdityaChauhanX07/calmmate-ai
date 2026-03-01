import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const EMOTION_EMOJIS: Record<string, string> = {
  joy: "😊",
  sadness: "😢",
  anger: "😠",
  fear: "😨",
  surprise: "😲",
  disgust: "🤢",
  neutral: "😐",
};

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
    <main className="relative min-h-screen w-full bg-[#0a0f1f] overflow-hidden">
      <Navbar />
      {/* Background glow blobs */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[160px] -top-40 -left-20" />
        <div className="absolute w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[150px] bottom-0 right-0" />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-10 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-white">
            Session <span className="text-blue-400">History</span>
          </h1>
          <span className="ml-auto text-gray-500 text-sm">
            {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="backdrop-blur-2xl bg-white/5 border border-white/10 shadow-2xl rounded-3xl p-12 sm:p-16 text-center">
            <p className="text-6xl mb-4">🧘</p>
            <p className="text-white text-xl font-semibold mb-2">Your journey starts here</p>
            <p className="text-gray-400 text-sm mb-2 max-w-xs mx-auto leading-relaxed">
              Each conversation you have will be saved here so you can track your emotional patterns over time.
            </p>
            <p className="text-gray-500 text-xs mb-8">No sessions recorded yet.</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 hover:bg-blue-500/30 transition text-sm"
            >
              Start your first session →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((s) => {
              const emoji = EMOTION_EMOJIS[s.emotion.toLowerCase()] ?? "😐";
              return (
                <article
                  key={s.id}
                  className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl"
                >
                  {/* Card header: emotion + date */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl leading-none" role="img" aria-label={s.emotion}>
                        {emoji}
                      </span>
                      <div>
                        <p className="text-white font-semibold capitalize">{s.emotion}</p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {(s.confidence * 100).toFixed(1)}% confidence
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs">{formatDate(s.createdAt)}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{formatTime(s.createdAt)}</p>
                    </div>
                  </div>

                  {/* Transcript */}
                  <div className="mb-4">
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1.5">
                      📝 Transcript
                    </p>
                    <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                      {s.transcript}
                    </p>
                  </div>

                  {/* AI Reply */}
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1.5">
                      🧠 AI Therapist
                    </p>
                    <p className="text-gray-300 text-sm leading-relaxed line-clamp-4">
                      {s.reply}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
