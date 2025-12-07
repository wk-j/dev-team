import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  workItems,
  streams,
  teamMemberships,
  timeEntries,
  users,
} from "@/lib/db/schema";
import { eq, and, isNull, desc, sql } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/work-items/[id]/time - Get time entries for a work item
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

    // Get all time entries for this work item with user info
    const entries = await db
      .select({
        id: timeEntries.id,
        workItemId: timeEntries.workItemId,
        userId: timeEntries.userId,
        startedAt: timeEntries.startedAt,
        stoppedAt: timeEntries.stoppedAt,
        duration: timeEntries.duration,
        description: timeEntries.description,
        user: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl,
          energySignatureColor: users.energySignatureColor,
        },
      })
      .from(timeEntries)
      .innerJoin(users, eq(timeEntries.userId, users.id))
      .where(eq(timeEntries.workItemId, id))
      .orderBy(desc(timeEntries.startedAt));

    // Calculate total time tracked
    const totalDuration = entries.reduce((sum, entry) => {
      if (entry.duration) {
        return sum + entry.duration;
      } else if (!entry.stoppedAt) {
        // Entry is still running - calculate current duration
        const now = new Date();
        const started = new Date(entry.startedAt);
        return sum + Math.floor((now.getTime() - started.getTime()) / 1000);
      }
      return sum;
    }, 0);

    // Check if current user has a running timer
    const activeEntry = entries.find(
      (e) => e.userId === session.user.id && !e.stoppedAt
    );

    return NextResponse.json({
      entries,
      totalDuration,
      activeEntry: activeEntry || null,
    });
  } catch (error) {
    console.error("Failed to fetch time entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch time entries" },
      { status: 500 }
    );
  }
}

// POST /api/work-items/[id]/time - Start a new time entry
export async function POST(request: NextRequest, context: RouteContext) {
  const session = await auth();
  const { id } = await context.params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { description } = body;

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

    // Check if user already has a running timer on this work item
    const existingEntry = await db.query.timeEntries.findFirst({
      where: and(
        eq(timeEntries.workItemId, id),
        eq(timeEntries.userId, session.user.id),
        isNull(timeEntries.stoppedAt)
      ),
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: "Timer already running for this work item" },
        { status: 400 }
      );
    }

    // Create new time entry
    const [newEntry] = await db
      .insert(timeEntries)
      .values({
        workItemId: id,
        userId: session.user.id,
        description: description?.trim() || null,
      })
      .returning();

    // Get user info for response
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    return NextResponse.json({
      entry: {
        ...newEntry,
        user: user
          ? {
              id: user.id,
              name: user.name,
              avatarUrl: user.avatarUrl,
              energySignatureColor: user.energySignatureColor,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Failed to start time entry:", error);
    return NextResponse.json(
      { error: "Failed to start time entry" },
      { status: 500 }
    );
  }
}

// PATCH /api/work-items/[id]/time - Stop the running time entry
export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await auth();
  const { id } = await context.params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { description } = body;

    // Find the running entry for this user on this work item
    const runningEntry = await db.query.timeEntries.findFirst({
      where: and(
        eq(timeEntries.workItemId, id),
        eq(timeEntries.userId, session.user.id),
        isNull(timeEntries.stoppedAt)
      ),
    });

    if (!runningEntry) {
      return NextResponse.json(
        { error: "No running timer found" },
        { status: 404 }
      );
    }

    // Calculate duration
    const now = new Date();
    const startedAt = new Date(runningEntry.startedAt);
    const duration = Math.floor((now.getTime() - startedAt.getTime()) / 1000);

    // Update the entry
    const updateData: Partial<typeof timeEntries.$inferInsert> = {
      stoppedAt: now,
      duration,
      updatedAt: now,
    };

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    const [updatedEntry] = await db
      .update(timeEntries)
      .set(updateData)
      .where(eq(timeEntries.id, runningEntry.id))
      .returning();

    // Get user info for response
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    return NextResponse.json({
      entry: {
        ...updatedEntry,
        user: user
          ? {
              id: user.id,
              name: user.name,
              avatarUrl: user.avatarUrl,
              energySignatureColor: user.energySignatureColor,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Failed to stop time entry:", error);
    return NextResponse.json(
      { error: "Failed to stop time entry" },
      { status: 500 }
    );
  }
}

// DELETE /api/work-items/[id]/time?entryId=xxx - Delete a time entry
export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await auth();
  const { id } = await context.params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entryId = request.nextUrl.searchParams.get("entryId");

  if (!entryId) {
    return NextResponse.json(
      { error: "entryId is required" },
      { status: 400 }
    );
  }

  try {
    const entry = await db.query.timeEntries.findFirst({
      where: eq(timeEntries.id, entryId),
    });

    if (!entry) {
      return NextResponse.json(
        { error: "Time entry not found" },
        { status: 404 }
      );
    }

    // Only allow deleting own entries
    if (entry.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Can only delete your own time entries" },
        { status: 403 }
      );
    }

    await db.delete(timeEntries).where(eq(timeEntries.id, entryId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete time entry:", error);
    return NextResponse.json(
      { error: "Failed to delete time entry" },
      { status: 500 }
    );
  }
}
