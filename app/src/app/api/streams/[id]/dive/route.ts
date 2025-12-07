import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { streams, teamMemberships, streamDivers, users } from "@/lib/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

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

    // Use UPSERT to handle the unique constraint properly
    // If a record exists for this stream/user, update it to be an active dive
    // If no record exists, insert a new one
    const diveResult = await db.execute<{
      id: string;
      stream_id: string;
      user_id: string;
      dived_at: Date;
      surfaced_at: Date | null;
    }>(sql`
      INSERT INTO stream_divers (stream_id, user_id, dived_at, surfaced_at)
      VALUES (${id}, ${session.user.id}, NOW(), NULL)
      ON CONFLICT (stream_id, user_id) 
      DO UPDATE SET dived_at = NOW(), surfaced_at = NULL
      RETURNING id, stream_id, user_id, dived_at, surfaced_at
    `);
    
    const dive = diveResult[0];

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
