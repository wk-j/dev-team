import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  workItems,
  streams,
  teamMemberships,
  workItemContributors,
  users,
  teams,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { type EnergyState, isValidTransition } from "@/lib/constants";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/work-items/[id] - Get work item with contributors
export async function GET(request: NextRequest, context: RouteContext) {
  const session = await auth();
  const { id } = await context.params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const item = await db.query.workItems.findFirst({
      where: eq(workItems.id, id),
    });

    if (!item) {
      return NextResponse.json(
        { error: "Work item not found" },
        { status: 404 }
      );
    }

    // Verify user has access via stream's team
    const stream = await db.query.streams.findFirst({
      where: eq(streams.id, item.streamId),
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

    // Get contributors
    const contributors = await db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        starType: users.starType,
        energySignatureColor: users.energySignatureColor,
        energyContributed: workItemContributors.energyContributed,
        isPrimary: workItemContributors.isPrimary,
        firstContributedAt: workItemContributors.firstContributedAt,
        lastContributedAt: workItemContributors.lastContributedAt,
      })
      .from(workItemContributors)
      .innerJoin(users, eq(workItemContributors.userId, users.id))
      .where(eq(workItemContributors.workItemId, id));

    return NextResponse.json({
      ...item,
      stream,
      contributors,
    });
  } catch (error) {
    console.error("Failed to fetch work item:", error);
    return NextResponse.json(
      { error: "Failed to fetch work item" },
      { status: 500 }
    );
  }
}

// Valid energy state transitions - uses centralized config via isValidTransition()

// PATCH /api/work-items/[id] - Update work item (including state transitions)
export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await auth();
  const { id } = await context.params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      title,
      description,
      depth,
      tags,
      energyState,
      energyLevel,
      streamPosition,
    } = body;

    const item = await db.query.workItems.findFirst({
      where: eq(workItems.id, id),
    });

    if (!item) {
      return NextResponse.json(
        { error: "Work item not found" },
        { status: 404 }
      );
    }

    // Verify user has access
    const stream = await db.query.streams.findFirst({
      where: eq(streams.id, item.streamId),
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

    // Validate energy state transition if changing state
    if (energyState && energyState !== item.energyState) {
      if (!isValidTransition(item.energyState as EnergyState, energyState as EnergyState)) {
        return NextResponse.json(
          {
            error: `Invalid state transition from ${item.energyState} to ${energyState}`,
          },
          { status: 400 }
        );
      }
    }

    const updateData: Partial<typeof workItems.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined)
      updateData.description = description?.trim() || null;
    if (depth !== undefined) updateData.depth = depth;
    if (tags !== undefined) updateData.tags = tags;
    if (streamPosition !== undefined) updateData.streamPosition = streamPosition;

    // Handle energy level updates
    if (energyLevel !== undefined) {
      updateData.energyLevel = Math.min(100, Math.max(0, energyLevel));

      // Auto-transition to blazing at 70% energy
      if (
        item.energyState === "kindling" &&
        updateData.energyLevel >= 70 &&
        !energyState
      ) {
        updateData.energyState = "blazing";
      }
    }

    // Handle state transitions with side effects
    if (energyState) {
      updateData.energyState = energyState;

      if (energyState === "kindling" && item.energyState === "dormant") {
        updateData.kindledAt = new Date();
        updateData.primaryDiverId = session.user.id;

        // Add as primary contributor
        await db
          .insert(workItemContributors)
          .values({
            workItemId: id,
            userId: session.user.id,
            isPrimary: true,
            energyContributed: 0,
          })
          .onConflictDoNothing();
      }

      if (energyState === "crystallized" && item.energyState === "cooling") {
        updateData.crystallizedAt = new Date();

        // Calculate crystal properties
        const contributors = await db.query.workItemContributors.findMany({
          where: eq(workItemContributors.workItemId, id),
        });

        const depthMultiplier: Record<string, number> = {
          shallow: 1,
          medium: 2,
          deep: 3,
          abyssal: 5,
        };

        updateData.crystalFacets = contributors.length;
        updateData.crystalBrilliance = Math.round(
          (item.energyLevel * (depthMultiplier[item.depth] || 2)) / 10
        );

        // Update stream crystal count
        await db
          .update(streams)
          .set({
            crystalCount: stream.crystalCount + 1,
            updatedAt: new Date(),
          })
          .where(eq(streams.id, stream.id));

        // Update team total crystals
        const team = await db.query.teams.findFirst({
          where: eq(teams.id, stream.teamId),
        });
        if (team) {
          await db
            .update(teams)
            .set({
              totalCrystals: (team.totalCrystals || 0) + 1,
            })
            .where(eq(teams.id, stream.teamId));
        }
      }
    }

    const [updatedItem] = await db
      .update(workItems)
      .set(updateData)
      .where(eq(workItems.id, id))
      .returning();

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Failed to update work item:", error);
    return NextResponse.json(
      { error: "Failed to update work item" },
      { status: 500 }
    );
  }
}

// DELETE /api/work-items/[id] - Delete work item
export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await auth();
  const { id } = await context.params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const item = await db.query.workItems.findFirst({
      where: eq(workItems.id, id),
    });

    if (!item) {
      return NextResponse.json(
        { error: "Work item not found" },
        { status: 404 }
      );
    }

    // Verify user has access
    const stream = await db.query.streams.findFirst({
      where: eq(streams.id, item.streamId),
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

    // Delete the item (contributors cascade)
    await db.delete(workItems).where(eq(workItems.id, id));

    // Update stream item count
    await db
      .update(streams)
      .set({
        itemCount: Math.max(0, stream.itemCount - 1),
        updatedAt: new Date(),
      })
      .where(eq(streams.id, stream.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete work item:", error);
    return NextResponse.json(
      { error: "Failed to delete work item" },
      { status: 500 }
    );
  }
}
