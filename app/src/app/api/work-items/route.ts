import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  workItems,
  streams,
  teamMemberships,
  workItemContributors,
  users,
} from "@/lib/db/schema";
import { eq, and, inArray, isNull } from "drizzle-orm";

// GET /api/work-items - List work items (filter by stream, state, user)
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    // Return empty array for unauthenticated users (demo mode)
    return NextResponse.json([]);
  }

  try {
    const { searchParams } = new URL(request.url);
    const streamId = searchParams.get("streamId");
    const energyState = searchParams.get("energyState");
    const userId = searchParams.get("userId");

    // Get user's team
    const membership = await db.query.teamMemberships.findFirst({
      where: eq(teamMemberships.userId, session.user.id),
    });

    if (!membership) {
      // Return empty array if user has no team yet
      return NextResponse.json([]);
    }

    // Get active streams for user's team (exclude evaporated/deleted streams)
    const teamStreams = await db.query.streams.findMany({
      where: and(
        eq(streams.teamId, membership.teamId),
        isNull(streams.evaporatedAt)
      ),
      columns: { id: true },
    });

    const teamStreamIds = teamStreams.map((s) => s.id);

    if (teamStreamIds.length === 0) {
      return NextResponse.json([]);
    }

    // Build query conditions
    let items = await db.query.workItems.findMany({
      where: streamId
        ? eq(workItems.streamId, streamId)
        : inArray(workItems.streamId, teamStreamIds),
      orderBy: (workItems, { desc }) => [desc(workItems.updatedAt)],
    });

    // Filter by energy state if provided
    if (energyState) {
      items = items.filter((item) => item.energyState === energyState);
    }

    // Filter by user if provided
    if (userId) {
      items = items.filter((item) => item.primaryDiverId === userId);
    }

    // Get contributors and assignee for each item
    const itemsWithContributors = await Promise.all(
      items.map(async (item) => {
        const contributors = await db
          .select({
            id: users.id,
            name: users.name,
            avatarUrl: users.avatarUrl,
            energySignatureColor: users.energySignatureColor,
            energyContributed: workItemContributors.energyContributed,
            isPrimary: workItemContributors.isPrimary,
          })
          .from(workItemContributors)
          .innerJoin(users, eq(workItemContributors.userId, users.id))
          .where(eq(workItemContributors.workItemId, item.id));

        // Get assignee (primary diver) info
        let assignee = null;
        if (item.primaryDiverId) {
          const assigneeData = await db.query.users.findFirst({
            where: eq(users.id, item.primaryDiverId),
            columns: {
              id: true,
              name: true,
              avatarUrl: true,
              energySignatureColor: true,
            },
          });
          assignee = assigneeData ?? null;
        }

        return {
          ...item,
          contributors,
          assignee,
        };
      })
    );

    return NextResponse.json(itemsWithContributors);
  } catch (error) {
    console.error("Failed to fetch work items:", error);
    return NextResponse.json(
      { error: "Failed to fetch work items" },
      { status: 500 }
    );
  }
}

// POST /api/work-items - Spark a new work item (dormant state)
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { streamId, title, description, depth, tags } = body;

    if (!streamId) {
      return NextResponse.json(
        { error: "Stream ID is required" },
        { status: 400 }
      );
    }

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Verify stream exists and user has access
    const stream = await db.query.streams.findFirst({
      where: eq(streams.id, streamId),
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    const membership = await db.query.teamMemberships.findFirst({
      where: and(
        eq(teamMemberships.userId, session.user.id),
        eq(teamMemberships.teamId, stream.teamId)
      ),
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Calculate stream position (add to end)
    const existingItems = await db.query.workItems.findMany({
      where: eq(workItems.streamId, streamId),
      columns: { streamPosition: true },
    });

    const maxPosition = existingItems.reduce(
      (max, item) => Math.max(max, item.streamPosition),
      0
    );
    const newPosition = Math.min(maxPosition + 0.1, 1);

    // Create the work item
    const [newItem] = await db
      .insert(workItems)
      .values({
        streamId,
        title: title.trim(),
        description: description?.trim() || null,
        depth: depth || "medium",
        tags: tags || [],
        energyState: "dormant",
        energyLevel: 0,
        streamPosition: newPosition,
      })
      .returning();

    // Update stream item count
    await db
      .update(streams)
      .set({
        itemCount: stream.itemCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(streams.id, streamId));

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("Failed to create work item:", error);
    return NextResponse.json(
      { error: "Failed to create work item" },
      { status: 500 }
    );
  }
}
