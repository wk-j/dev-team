import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  workItems,
  streams,
  teamMemberships,
  workItemContributors,
  users,
  resonancePings,
  resonanceConnections,
} from "@/lib/db/schema";
import { eq, and, or, sql } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/work-items/[id]/handoff - Hand off a work item to another team member
export async function POST(request: NextRequest, context: RouteContext) {
  const session = await auth();
  const { id } = await context.params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { toUserId, message } = body;

    if (!toUserId) {
      return NextResponse.json(
        { error: "toUserId is required" },
        { status: 400 }
      );
    }

    // Get the work item
    const item = await db.query.workItems.findFirst({
      where: eq(workItems.id, id),
    });

    if (!item) {
      return NextResponse.json(
        { error: "Work item not found" },
        { status: 404 }
      );
    }

    // Only active items can be handed off (kindling, blazing, cooling)
    if (item.energyState === "dormant" || item.energyState === "crystallized") {
      return NextResponse.json(
        { error: "Cannot hand off dormant or crystallized items" },
        { status: 400 }
      );
    }

    // Verify user has access and is the primary diver
    const stream = await db.query.streams.findFirst({
      where: eq(streams.id, item.streamId),
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    const senderMembership = await db.query.teamMemberships.findFirst({
      where: and(
        eq(teamMemberships.userId, session.user.id),
        eq(teamMemberships.teamId, stream.teamId)
      ),
    });

    if (!senderMembership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if user is the primary diver
    if (item.primaryDiverId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the primary diver can hand off a work item" },
        { status: 403 }
      );
    }

    // Verify target user is in the same team
    const receiverMembership = await db.query.teamMemberships.findFirst({
      where: and(
        eq(teamMemberships.userId, toUserId),
        eq(teamMemberships.teamId, stream.teamId)
      ),
    });

    if (!receiverMembership) {
      return NextResponse.json(
        { error: "Target user is not in the same team" },
        { status: 400 }
      );
    }

    // Can't hand off to yourself
    if (toUserId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot hand off to yourself" },
        { status: 400 }
      );
    }

    // Update work item primary diver
    const [updatedItem] = await db
      .update(workItems)
      .set({
        primaryDiverId: toUserId,
        updatedAt: new Date(),
      })
      .where(eq(workItems.id, id))
      .returning();

    // Update or create contributor entry for new primary
    const existingContributor = await db.query.workItemContributors.findFirst({
      where: and(
        eq(workItemContributors.workItemId, id),
        eq(workItemContributors.userId, toUserId)
      ),
    });

    if (existingContributor) {
      // Update existing contributor to be primary
      await db
        .update(workItemContributors)
        .set({ isPrimary: true, lastContributedAt: new Date() })
        .where(eq(workItemContributors.id, existingContributor.id));
    } else {
      // Add as new primary contributor
      await db.insert(workItemContributors).values({
        workItemId: id,
        userId: toUserId,
        isPrimary: true,
        energyContributed: 0,
      });
    }

    // Update old primary to not be primary
    await db
      .update(workItemContributors)
      .set({ isPrimary: false })
      .where(
        and(
          eq(workItemContributors.workItemId, id),
          eq(workItemContributors.userId, session.user.id)
        )
      );

    // Send a ping to notify the recipient
    await db.insert(resonancePings).values({
      fromUserId: session.user.id,
      toUserId,
      type: "warm",
      message: message || `Handed off: ${item.title}`,
      relatedWorkItemId: id,
      relatedStreamId: item.streamId,
    });

    // Update resonance connection
    const existingConnection = await db
      .select()
      .from(resonanceConnections)
      .where(
        or(
          and(
            eq(resonanceConnections.userIdA, session.user.id),
            eq(resonanceConnections.userIdB, toUserId)
          ),
          and(
            eq(resonanceConnections.userIdA, toUserId),
            eq(resonanceConnections.userIdB, session.user.id)
          )
        )
      )
      .limit(1);

    if (existingConnection.length > 0 && existingConnection[0]) {
      // Update existing connection (handoffs are significant)
      await db
        .update(resonanceConnections)
        .set({
          sharedWorkItems: sql`${resonanceConnections.sharedWorkItems} + 1`,
          resonanceScore: sql`LEAST(100, ${resonanceConnections.resonanceScore} + 5)`,
          lastInteractionAt: new Date(),
        })
        .where(eq(resonanceConnections.id, existingConnection[0].id));
    } else {
      // Create new connection
      await db.insert(resonanceConnections).values({
        teamId: stream.teamId,
        userIdA: session.user.id,
        userIdB: toUserId,
        sharedWorkItems: 1,
        resonanceScore: 10,
      });
    }

    // Get sender and receiver info for response
    const [sender, receiver] = await Promise.all([
      db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { id: true, name: true, avatarUrl: true },
      }),
      db.query.users.findFirst({
        where: eq(users.id, toUserId),
        columns: { id: true, name: true, avatarUrl: true },
      }),
    ]);

    return NextResponse.json({
      workItem: updatedItem,
      handoff: {
        from: sender,
        to: receiver,
        message,
        handedOffAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to hand off work item:", error);
    return NextResponse.json(
      { error: "Failed to hand off work item" },
      { status: 500 }
    );
  }
}
