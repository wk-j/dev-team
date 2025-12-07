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
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/work-items/[id]/assign - Assign a dormant work item to a team member
export async function POST(request: NextRequest, context: RouteContext) {
  const session = await auth();
  const { id } = await context.params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { toUserId, message } = body;
    
    console.log(`[ASSIGN] Attempting to assign work item ${id} to user ${toUserId}`);

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

    // Only dormant items can be assigned
    if (item.energyState !== "dormant") {
      console.log(`[ASSIGN] Failed - work item ${id} is in ${item.energyState} state, not dormant`);
      return NextResponse.json(
        { error: `Only dormant work items can be assigned. This item is ${item.energyState}. Use handoff for active items.` },
        { status: 400 }
      );
    }

    // Verify user has access to the stream
    const stream = await db.query.streams.findFirst({
      where: eq(streams.id, item.streamId),
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    const assignerMembership = await db.query.teamMemberships.findFirst({
      where: and(
        eq(teamMemberships.userId, session.user.id),
        eq(teamMemberships.teamId, stream.teamId)
      ),
    });

    if (!assignerMembership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify target user is in the same team
    const assigneeMembership = await db.query.teamMemberships.findFirst({
      where: and(
        eq(teamMemberships.userId, toUserId),
        eq(teamMemberships.teamId, stream.teamId)
      ),
    });

    if (!assigneeMembership) {
      return NextResponse.json(
        { error: "Target user is not in the same team" },
        { status: 400 }
      );
    }

    // Update work item to kindling state with the assignee as primary diver
    const [updatedItem] = await db
      .update(workItems)
      .set({
        energyState: "kindling",
        primaryDiverId: toUserId,
        kindledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(workItems.id, id))
      .returning();

    // Add assignee as primary contributor
    await db
      .insert(workItemContributors)
      .values({
        workItemId: id,
        userId: toUserId,
        isPrimary: true,
        energyContributed: 0,
      })
      .onConflictDoNothing();

    // Send a ping to notify the assignee
    await db.insert(resonancePings).values({
      fromUserId: session.user.id,
      toUserId,
      type: "warm",
      message: message || `Energy infused! "${item.title}" has been assigned to you.`,
      relatedWorkItemId: id,
      relatedStreamId: item.streamId,
    });

    // Get assigner and assignee info for response
    const [assigner, assignee] = await Promise.all([
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
      assignment: {
        from: assigner,
        to: assignee,
        message,
        assignedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to assign work item:", error);
    return NextResponse.json(
      { error: "Failed to assign work item" },
      { status: 500 }
    );
  }
}
