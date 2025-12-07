import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  teamMemberships,
  streams,
  workItems,
  energyEvents,
} from "@/lib/db/schema";
import { eq, and, sql, desc, gte, isNull } from "drizzle-orm";

// GET /api/observatory/metrics - Get team dashboard metrics
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

    // Get team members count by orbital state
    const teamMembers = await db
      .select({
        orbitalState: users.orbitalState,
        count: sql<number>`count(*)`,
      })
      .from(users)
      .innerJoin(teamMemberships, eq(users.id, teamMemberships.userId))
      .where(
        and(
          eq(teamMemberships.teamId, teamId),
          isNull(users.deletedAt)
        )
      )
      .groupBy(users.orbitalState);

    // Transform to a more usable format
    const orbitalStateCounts = {
      open: 0,
      focused: 0,
      deep_work: 0,
      away: 0,
      supernova: 0,
      total: 0,
    };

    for (const member of teamMembers) {
      orbitalStateCounts[member.orbitalState] = Number(member.count);
      orbitalStateCounts.total += Number(member.count);
    }

    // Get active streams (not evaporated)
    const [activeStreamsResult] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(streams)
      .where(
        and(
          eq(streams.teamId, teamId),
          isNull(streams.evaporatedAt)
        )
      );

    const activeStreamsCount = Number(activeStreamsResult?.count ?? 0);

    // Get work items by energy state
    const workItemsByState = await db
      .select({
        energyState: workItems.energyState,
        count: sql<number>`count(*)`,
      })
      .from(workItems)
      .innerJoin(streams, eq(workItems.streamId, streams.id))
      .where(
        and(
          eq(streams.teamId, teamId),
          isNull(streams.evaporatedAt)
        )
      )
      .groupBy(workItems.energyState);

    const energyStateCounts = {
      dormant: 0,
      kindling: 0,
      blazing: 0,
      cooling: 0,
      crystallized: 0,
      total: 0,
    };

    for (const item of workItemsByState) {
      energyStateCounts[item.energyState] = Number(item.count);
      energyStateCounts.total += Number(item.count);
    }

    // Get crystals (crystallized items) - today, this week, total
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [crystalsToday] = await db
      .select({ count: sql<number>`count(*)` })
      .from(workItems)
      .innerJoin(streams, eq(workItems.streamId, streams.id))
      .where(
        and(
          eq(streams.teamId, teamId),
          eq(workItems.energyState, "crystallized"),
          gte(workItems.crystallizedAt, startOfToday)
        )
      );

    const [crystalsThisWeek] = await db
      .select({ count: sql<number>`count(*)` })
      .from(workItems)
      .innerJoin(streams, eq(workItems.streamId, streams.id))
      .where(
        and(
          eq(streams.teamId, teamId),
          eq(workItems.energyState, "crystallized"),
          gte(workItems.crystallizedAt, startOfWeek)
        )
      );

    const [crystalsTotal] = await db
      .select({ count: sql<number>`count(*)` })
      .from(workItems)
      .innerJoin(streams, eq(workItems.streamId, streams.id))
      .where(
        and(
          eq(streams.teamId, teamId),
          eq(workItems.energyState, "crystallized")
        )
      );

    // Get recent crystallizations (last 10)
    const recentCrystallizations = await db
      .select({
        id: workItems.id,
        title: workItems.title,
        streamId: workItems.streamId,
        streamName: streams.name,
        crystallizedAt: workItems.crystallizedAt,
        crystalFacets: workItems.crystalFacets,
        crystalBrilliance: workItems.crystalBrilliance,
      })
      .from(workItems)
      .innerJoin(streams, eq(workItems.streamId, streams.id))
      .where(
        and(
          eq(streams.teamId, teamId),
          eq(workItems.energyState, "crystallized")
        )
      )
      .orderBy(desc(workItems.crystallizedAt))
      .limit(10);

    // Calculate team pulse rate (based on recent activity)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const [recentEvents] = await db
      .select({ count: sql<number>`count(*)` })
      .from(energyEvents)
      .where(
        and(
          eq(energyEvents.teamId, teamId),
          gte(energyEvents.occurredAt, oneHourAgo)
        )
      );

    const eventsLastHour = Number(recentEvents?.count ?? 0);
    // Map events to pulse rate (0-100)
    const pulseRate = Math.min(100, Math.floor(eventsLastHour * 2));

    // Calculate team energy level (average of all active members)
    const [avgEnergy] = await db
      .select({
        avg: sql<number>`avg(${users.currentEnergyLevel})`,
      })
      .from(users)
      .innerJoin(teamMemberships, eq(users.id, teamMemberships.userId))
      .where(
        and(
          eq(teamMemberships.teamId, teamId),
          isNull(users.deletedAt)
        )
      );

    const teamEnergyLevel = Math.round(Number(avgEnergy?.avg ?? 75));

    return NextResponse.json({
      team: {
        pulseRate,
        energyLevel: teamEnergyLevel,
        membersOnline: orbitalStateCounts.open + orbitalStateCounts.focused,
        membersInDeepWork: orbitalStateCounts.deep_work,
        membersAway: orbitalStateCounts.away,
        totalMembers: orbitalStateCounts.total,
      },
      streams: {
        active: activeStreamsCount,
      },
      workItems: {
        byState: energyStateCounts,
        active: energyStateCounts.kindling + energyStateCounts.blazing + energyStateCounts.cooling,
        total: energyStateCounts.total,
      },
      crystals: {
        today: Number(crystalsToday?.count ?? 0),
        thisWeek: Number(crystalsThisWeek?.count ?? 0),
        total: Number(crystalsTotal?.count ?? 0),
        recent: recentCrystallizations,
      },
      orbitalStates: orbitalStateCounts,
    });
  } catch (error) {
    console.error("Failed to fetch observatory metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch observatory metrics" },
      { status: 500 }
    );
  }
}
