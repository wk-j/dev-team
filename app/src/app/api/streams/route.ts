import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { streams, teamMemberships, streamDivers, users } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";

// GET /api/streams - List streams for user's team
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    // Return empty array for unauthenticated users (demo mode)
    return NextResponse.json([]);
  }

  // Check if we should include closed (evaporated) streams
  const { searchParams } = new URL(request.url);
  const includeClosed = searchParams.get("includeClosed") === "true";

  try {
    // Get user's team membership
    const membership = await db.query.teamMemberships.findFirst({
      where: eq(teamMemberships.userId, session.user.id),
    });

    if (!membership) {
      // Return empty array if user has no team yet
      return NextResponse.json([]);
    }

    // Get streams for the team (optionally including closed ones)
    const whereCondition = includeClosed
      ? eq(streams.teamId, membership.teamId)
      : and(
          eq(streams.teamId, membership.teamId),
          isNull(streams.evaporatedAt)
        );

    const teamStreams = await db.query.streams.findMany({
      where: whereCondition,
      orderBy: (streams, { asc }) => [asc(streams.createdAt)],
    });

    // Get active divers for each stream
    const streamsWithDivers = await Promise.all(
      teamStreams.map(async (stream) => {
        const divers = await db
          .select({
            id: users.id,
            name: users.name,
            avatarUrl: users.avatarUrl,
            starType: users.starType,
            orbitalState: users.orbitalState,
            divedAt: streamDivers.divedAt,
          })
          .from(streamDivers)
          .innerJoin(users, eq(streamDivers.userId, users.id))
          .where(
            and(
              eq(streamDivers.streamId, stream.id),
              isNull(streamDivers.surfacedAt)
            )
          );

        return {
          ...stream,
          divers,
        };
      })
    );

    return NextResponse.json(streamsWithDivers);
  } catch (error) {
    console.error("Failed to fetch streams:", error);
    return NextResponse.json(
      { error: "Failed to fetch streams" },
      { status: 500 }
    );
  }
}

// POST /api/streams - Create a new stream
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, pathPoints } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Get user's team
    const membership = await db.query.teamMemberships.findFirst({
      where: eq(teamMemberships.userId, session.user.id),
    });

    if (!membership) {
      return NextResponse.json({ error: "No team found" }, { status: 404 });
    }

    // Generate default path points if not provided
    const defaultPathPoints = pathPoints || [
      { x: -10, y: 0, z: 0, t: 0 },
      { x: -5, y: 2, z: 1, t: 0.25 },
      { x: 0, y: 0, z: 2, t: 0.5 },
      { x: 5, y: -2, z: 1, t: 0.75 },
      { x: 10, y: 0, z: 0, t: 1 },
    ];

    const [newStream] = await db
      .insert(streams)
      .values({
        teamId: membership.teamId,
        name: name.trim(),
        description: description?.trim() || null,
        pathPoints: defaultPathPoints,
        state: "nascent",
        velocity: 1.0,
      })
      .returning();

    return NextResponse.json(newStream, { status: 201 });
  } catch (error) {
    console.error("Failed to create stream:", error);
    return NextResponse.json(
      { error: "Failed to create stream" },
      { status: 500 }
    );
  }
}
