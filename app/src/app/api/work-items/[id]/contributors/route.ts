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
import { eq, and } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/work-items/[id]/contributors - Add a contributor to work item
export async function POST(request: NextRequest, context: RouteContext) {
  const session = await auth();
  const { id } = await context.params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
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

    // Verify target user is in the same team
    const targetMembership = await db.query.teamMemberships.findFirst({
      where: and(
        eq(teamMemberships.userId, userId),
        eq(teamMemberships.teamId, stream.teamId)
      ),
    });

    if (!targetMembership) {
      return NextResponse.json(
        { error: "Target user is not in the same team" },
        { status: 400 }
      );
    }

    // Check if already a contributor
    const existingContributor = await db.query.workItemContributors.findFirst({
      where: and(
        eq(workItemContributors.workItemId, id),
        eq(workItemContributors.userId, userId)
      ),
    });

    if (existingContributor) {
      return NextResponse.json(
        { error: "User is already a contributor" },
        { status: 400 }
      );
    }

    // Determine if this should be the primary diver (first contributor or no primary yet)
    const isPrimary = !item.primaryDiverId;

    // Add contributor
    const [newContributor] = await db
      .insert(workItemContributors)
      .values({
        workItemId: id,
        userId,
        isPrimary,
        energyContributed: 0,
      })
      .returning();

    // If this is the first contributor, set as primary diver
    if (isPrimary) {
      await db
        .update(workItems)
        .set({
          primaryDiverId: userId,
          updatedAt: new Date(),
        })
        .where(eq(workItems.id, id));
    }

    // Get the user info
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        name: true,
        avatarUrl: true,
        energySignatureColor: true,
      },
    });

    return NextResponse.json({
      contributor: {
        ...newContributor,
        ...user,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to add contributor:", error);
    return NextResponse.json(
      { error: "Failed to add contributor" },
      { status: 500 }
    );
  }
}

// DELETE /api/work-items/[id]/contributors - Remove a contributor from work item
export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await auth();
  const { id } = await context.params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId query param is required" },
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

    // Remove contributor
    await db
      .delete(workItemContributors)
      .where(
        and(
          eq(workItemContributors.workItemId, id),
          eq(workItemContributors.userId, userId)
        )
      );

    // If removed contributor was the primary diver, reassign to another contributor or clear
    if (item.primaryDiverId === userId) {
      const remainingContributor = await db.query.workItemContributors.findFirst({
        where: eq(workItemContributors.workItemId, id),
      });

      if (remainingContributor) {
        // Make another contributor the primary
        await db
          .update(workItemContributors)
          .set({ isPrimary: true })
          .where(eq(workItemContributors.id, remainingContributor.id));

        await db
          .update(workItems)
          .set({
            primaryDiverId: remainingContributor.userId,
            updatedAt: new Date(),
          })
          .where(eq(workItems.id, id));
      } else {
        // No more contributors, clear primary diver
        await db
          .update(workItems)
          .set({
            primaryDiverId: null,
            updatedAt: new Date(),
          })
          .where(eq(workItems.id, id));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove contributor:", error);
    return NextResponse.json(
      { error: "Failed to remove contributor" },
      { status: 500 }
    );
  }
}
