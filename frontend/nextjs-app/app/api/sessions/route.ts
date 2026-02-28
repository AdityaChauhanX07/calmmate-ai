import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { transcript, emotion, confidence, reply } = body as Record<string, unknown>;

  if (
    typeof transcript !== "string" || !transcript ||
    typeof emotion !== "string" || !emotion ||
    confidence == null || isNaN(Number(confidence)) ||
    typeof reply !== "string" || !reply
  ) {
    return NextResponse.json({ error: "Missing or invalid required fields" }, { status: 400 });
  }

  try {
    const saved = await prisma.sessionData.create({
      data: {
        userId: session.user.id,
        transcript,
        emotion,
        confidence: Number(confidence),
        reply,
      },
    });
    return NextResponse.json({ success: true, id: saved.id }, { status: 201 });
  } catch (error) {
    console.error("[sessions POST] Failed to save session:", error);
    return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("[sessions GET] Failed to fetch sessions:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}
