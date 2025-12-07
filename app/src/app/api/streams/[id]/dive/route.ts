import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { streams, teamMemberships, streamDivers, users } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/streams/[id]/dive - Enter stream focus mode
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

    // Verify user has access to this stream's team
    const membership = await db.query.teamMemberships.findFirst({
      where: and(
        eq(teamMemberships.userId, session.user.id),
        eq(teamMemberships.teamId, stream.teamId)
      ),
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if already diving in this stream (active dive with no surfacedAt)
    const existingActiveDive = await db.query.streamDivers.findFirst({
      where: and(
        eq(streamDivers.streamId, id),
        eq(streamDivers.userId, session.user.id),
        isNull(streamDivers.surfacedAt)
      ),
    });

    if (existingActiveDive) {
      return NextResponse.json(
        { error: "Already diving in this stream" },
        { status: 409 }
      );
    }

    // Surface from any other streams first (can only dive in one stream at a time)
    await db
      .update(streamDivers)
      .set({ surfacedAt: new Date() })
      .where(
        and(
          eq(streamDivers.userId, session.user.id),
          isNull(streamDivers.surfacedAt)
        )
      );

    // Delete any existing dive records for this stream to avoid unique constraint
    // This includes both surfaced and active dives (in case of data inconsistency)
    await db
      .delete(streamDivers)
      .where(
        and(
          eq(streamDivers.streamId, id),
          eq(streamDivers.userId, session.user.id)
        )
      );

    // Create new dive record
    const [dive] = await db
      .insert(streamDivers)
      .values({
        streamId: id,
        userId: session.user.id,
        divedAt: new Date(),
        surfacedAt: null,
      })
      .returning();

    // Update user's orbital state to focused
    await db
      .update(users)
      .set({
        orbitalState: "focused",
        lastActiveAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    // Get current divers for response
    const currentDivers = await db
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
      dive,
      stream,
      divers: currentDivers,
    });
  } catch (error) {
    console.error("Failed to dive into stream:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to dive into stream: ${errorMessage}` },
      { status: 500 }
    );
  }
}
