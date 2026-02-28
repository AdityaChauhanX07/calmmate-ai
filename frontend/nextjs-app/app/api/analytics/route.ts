import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await prisma.sessionData.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
      select: {
        emotion: true,
        confidence: true,
        createdAt: true,
      },
    });

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const dateKey = (d: Date) => d.toISOString().slice(0, 10);

    // Build 14-day slot array (today-13 → today)
    const emotionOverTime = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - (13 - i));
      return { date: dateKey(d), emotion: "", confidence: null as number | null };
    });

    // Early return for empty state
    if (rows.length === 0) {
      return NextResponse.json({
        emotionCounts: [],
        emotionOverTime,
        averageConfidence: 0,
        totalSessions: 0,
        mostFrequentEmotion: "—",
        streakDays: 0,
      });
    }

    // Aggregate emotion counts, confidence total, and date set
    const freqMap: Record<string, number> = {};
    let totalConf = 0;
    const dateSet = new Set<string>();

    for (const row of rows) {
      freqMap[row.emotion] = (freqMap[row.emotion] ?? 0) + 1;
      totalConf += row.confidence;
      dateSet.add(dateKey(row.createdAt));
    }

    const emotionCounts = Object.entries(freqMap)
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count);

    const averageConfidence = parseFloat((totalConf / rows.length).toFixed(4));
    const mostFrequentEmotion = emotionCounts[0]?.emotion ?? "—";

    // Fill emotionOverTime slots (rows are asc, so later rows overwrite earlier ones per day)
    const windowStart = emotionOverTime[0].date;
    const todayKey = dateKey(today);
    const slotMap: Record<string, { emotion: string; confidence: number }> = {};

    for (const row of rows) {
      const dk = dateKey(row.createdAt);
      if (dk >= windowStart && dk <= todayKey) {
        slotMap[dk] = { emotion: row.emotion, confidence: row.confidence };
      }
    }

    for (const slot of emotionOverTime) {
      if (slotMap[slot.date]) {
        slot.emotion = slotMap[slot.date].emotion;
        slot.confidence = slotMap[slot.date].confidence;
      }
    }

    // Streak: start from today if it has a session, else try yesterday
    let streakDays = 0;
    const startKey = dateSet.has(todayKey)
      ? todayKey
      : (() => {
          const yesterday = new Date(today);
          yesterday.setUTCDate(yesterday.getUTCDate() - 1);
          return dateKey(yesterday);
        })();

    if (dateSet.has(startKey)) {
      const cursor = new Date(startKey + "T00:00:00Z");
      while (dateSet.has(dateKey(cursor))) {
        streakDays++;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      }
    }

    return NextResponse.json({
      emotionCounts,
      emotionOverTime,
      averageConfidence,
      totalSessions: rows.length,
      mostFrequentEmotion,
      streakDays,
    });
  } catch (error) {
    console.error("[analytics GET] Failed to compute analytics:", error);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
