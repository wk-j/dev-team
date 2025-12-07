import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  teamMemberships,
  energyEvents,
  streams,
  workItems,
} from "@/lib/db/schema";
import { eq, and, sql, desc, gte } from "drizzle-orm";

// GET /api/observatory/pulse - Get real-time pulse data for Pulse Core visualization
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user's team membership
    const membership = await db.query.teamMemberships.findFirst({
      where: eq(teamMemberships.userId, session.user.id),
    });

    if (!membership) {
      return NextResponse.json({ error: "No team found" }, { status: 404 });
    }

    const teamId = membership.teamId;
    const now = new Date();

    // Get recent activity (last 5 minutes for real-time pulse)
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Get recent energy events
    const recentEvents = await db
      .select({
        eventType: energyEvents.eventType,
        occurredAt: energyEvents.occurredAt,
        data: energyEvents.data,
      })
      .from(energyEvents)
      .where(
        and(
          eq(energyEvents.teamId, teamId),
          gte(energyEvents.occurredAt, fiveMinutesAgo)
        )
      )
      .orderBy(desc(energyEvents.occurredAt))
      .limit(50);

    // Count events in last hour by type
    const eventsByType = await db
      .select({
        eventType: energyEvents.eventType,
        count: sql<number>`count(*)`,
      })
      .from(energyEvents)
      .where(
        and(
          eq(energyEvents.teamId, teamId),
          gte(energyEvents.occurredAt, oneHourAgo)
        )
      )
      .groupBy(energyEvents.eventType);

    // Calculate pulse rate based on activity
    const totalEventsLastHour = eventsByType.reduce((sum, e) => sum + Number(e.count), 0);
    const pulseRate = Math.min(100, Math.floor(totalEventsLastHour * 2));

    // Get total energy from all active work items
    const [energyResult] = await db
      .select({
        totalEnergy: sql<number>`sum(${workItems.energyLevel})`,
        activeCount: sql<number>`count(*)`,
      })
      .from(workItems)
      .innerJoin(streams, eq(workItems.streamId, streams.id))
      .where(
        and(
          eq(streams.teamId, teamId),
          sql`${workItems.energyState} IN ('kindling', 'blazing', 'cooling')`
        )
      );

    const totalEnergy = Number(energyResult?.totalEnergy ?? 0);
    const activeWorkItems = Number(energyResult?.activeCount ?? 0);

    // Calculate energy level (0-100 scale)
    // Assume each work item can have max 100 energy, so normalize
    const maxPossibleEnergy = activeWorkItems * 100;
    const energyLevel = maxPossibleEnergy > 0 
      ? Math.min(100, Math.floor((totalEnergy / maxPossibleEnergy) * 100))
      : 50; // Default to 50 if no active work

    // Get activity timeline (last 60 minutes in 5-minute buckets)
    const activityTimeline = [];
    for (let i = 0; i < 12; i++) {
      const bucketEnd = new Date(now.getTime() - i * 5 * 60 * 1000);
      const bucketStart = new Date(bucketEnd.getTime() - 5 * 60 * 1000);
      
      const [bucketEvents] = await db
        .select({ count: sql<number>`count(*)` })
        .from(energyEvents)
        .where(
          and(
            eq(energyEvents.teamId, teamId),
            gte(energyEvents.occurredAt, bucketStart),
            sql`${energyEvents.occurredAt} < ${bucketEnd}`
          )
        );

      activityTimeline.unshift({
        timestamp: bucketEnd.toISOString(),
        eventCount: Number(bucketEvents?.count ?? 0),
      });
    }

    // Categorize event types
    const eventCategories = {
      crystallization: 0,
      kindle: 0,
      ping: 0,
      dive: 0,
      other: 0,
    };

    for (const event of eventsByType) {
      const type = event.eventType.toLowerCase();
      const count = Number(event.count);
      
      if (type.includes("crystallize")) {
        eventCategories.crystallization += count;
      } else if (type.includes("kindle") || type.includes("blaze")) {
        eventCategories.kindle += count;
      } else if (type.includes("ping")) {
        eventCategories.ping += count;
      } else if (type.includes("dive") || type.includes("surface")) {
        eventCategories.dive += count;
      } else {
        eventCategories.other += count;
      }
    }

    return NextResponse.json({
      pulseRate,
      energyLevel,
      timestamp: now.toISOString(),
      recentEvents: recentEvents.map(e => ({
        type: e.eventType,
        occurredAt: e.occurredAt,
        data: e.data,
      })),
      activityTimeline,
      eventCategories,
      stats: {
        totalEventsLastHour,
        activeWorkItems,
        totalEnergy,
      },
    });
  } catch (error) {
    console.error("Failed to fetch pulse data:", error);
    return NextResponse.json(
      { error: "Failed to fetch pulse data" },
      { status: 500 }
    );
  }
}
