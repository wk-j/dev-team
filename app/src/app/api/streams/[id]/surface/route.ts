import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { streams, teamMemberships, streamDivers, users } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/streams/[id]/surface - Exit stream focus mode
export async function POST(request: NextRequest, context: RouteContext) {
  const session = await auth();
  const { id } = await context.params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify stream exists
    const stream = await db.query.streams.findFirst({
      where: eq(streams.id, id),
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    // Verify user has access
    const membership = await db.query.teamMemberships.findFirst({
      where: and(
        eq(teamMemberships.userId, session.user.id),
        eq(teamMemberships.teamId, stream.teamId)
      ),
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find active dive
    const activeDive = await db.query.streamDivers.findFirst({
      where: and(
        eq(streamDivers.streamId, id),
        eq(streamDivers.userId, session.user.id),
        isNull(streamDivers.surfacedAt)
      ),
    });

    if (!activeDive) {
      return NextResponse.json(
        { error: "Not currently diving in this stream" },
        { status: 404 }
      );
    }

    // Update dive record with surface time
    const [surfacedDive] = await db
      .update(streamDivers)
      .set({ surfacedAt: new Date() })
      .where(eq(streamDivers.id, activeDive.id))
      .returning();

    // Update user's orbital state back to open
    await db
      .update(users)
      .set({
        orbitalState: "open",
        lastActiveAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    // Calculate dive duration
    const diveStarted = new Date(activeDive.divedAt);
    const diveDuration = Math.round(
      (Date.now() - diveStarted.getTime()) / 1000 / 60
    ); // in minutes

    // Get remaining divers
    const remainingDivers = await db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        starType: users.starType,
        orbitalState: users.orbitalState,
        energySignatureColor: users.energySignatureColor,
        divedAt: streamDivers.divedAt,
      })
      .from(streamDivers)
      .innerJoin(users, eq(streamDivers.userId, users.id))
      .where(
        and(eq(streamDivers.streamId, id), isNull(streamDivers.surfacedAt))
      );

    return NextResponse.json({
      surfaced: surfacedDive,
      diveDuration,
      stream,
      remainingDivers,
    });
  } catch (error) {
    console.error("Failed to surface from stream:", error);
    return NextResponse.json(
      { error: "Failed to surface from stream" },
      { status: 500 }
    );
  }
}
