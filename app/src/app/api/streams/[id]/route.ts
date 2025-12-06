import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  streams,
  teamMemberships,
  streamDivers,
  workItems,
  users,
} from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/streams/[id] - Get stream with work items and divers
export async function GET(request: NextRequest, context: RouteContext) {
  const session = await auth();
  const { id } = await context.params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    // Get active divers
    const divers = await db
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

    // Get work items in this stream
    const items = await db.query.workItems.findMany({
      where: eq(workItems.streamId, id),
      orderBy: (workItems, { asc }) => [asc(workItems.streamPosition)],
    });

    return NextResponse.json({
      ...stream,
      divers,
      workItems: items,
    });
  } catch (error) {
    console.error("Failed to fetch stream:", error);
    return NextResponse.json(
      { error: "Failed to fetch stream" },
      { status: 500 }
    );
  }
}

// PATCH /api/streams/[id] - Update stream
export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await auth();
  const { id } = await context.params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, state, velocity, pathPoints } = body;

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

    const updateData: Partial<typeof streams.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (state !== undefined) updateData.state = state;
    if (velocity !== undefined) updateData.velocity = velocity;
    if (pathPoints !== undefined) updateData.pathPoints = pathPoints;

    const [updatedStream] = await db
      .update(streams)
      .set(updateData)
      .where(eq(streams.id, id))
      .returning();

    return NextResponse.json(updatedStream);
  } catch (error) {
    console.error("Failed to update stream:", error);
    return NextResponse.json(
      { error: "Failed to update stream" },
      { status: 500 }
    );
  }
}

// DELETE /api/streams/[id] - Evaporate (soft delete) stream
export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await auth();
  const { id } = await context.params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    // Soft delete by setting evaporatedAt
    const [evaporatedStream] = await db
      .update(streams)
      .set({
        evaporatedAt: new Date(),
        state: "evaporated",
        updatedAt: new Date(),
      })
      .where(eq(streams.id, id))
      .returning();

    return NextResponse.json(evaporatedStream);
  } catch (error) {
    console.error("Failed to evaporate stream:", error);
    return NextResponse.json(
      { error: "Failed to evaporate stream" },
      { status: 500 }
    );
  }
}
