import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  workItems,
  streams,
  teamMemberships,
  users,
  workItemContributors,
} from "@/lib/db/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";

// GET /api/crystals - Get Crystal Garden data (completed work items)
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 500);
    const offset = parseInt(searchParams.get("offset") ?? "0");
    const streamId = searchParams.get("streamId");
    const userId = searchParams.get("userId");
    const sinceDate = searchParams.get("since"); // ISO date string

    // Build conditions
    const conditions = [eq(streams.teamId, teamId), eq(workItems.energyState, "crystallized")];

    if (streamId) {
      conditions.push(eq(workItems.streamId, streamId));
    }

    if (sinceDate) {
      const since = new Date(sinceDate);
      if (!isNaN(since.getTime())) {
        conditions.push(gte(workItems.crystallizedAt, since));
      }
    }

    // Get crystallized work items
    let crystalsQuery = db
      .select({
        id: workItems.id,
        title: workItems.title,
        description: workItems.description,
        streamId: workItems.streamId,
        streamName: streams.name,
        energyLevel: workItems.energyLevel,
        depth: workItems.depth,
        crystalFacets: workItems.crystalFacets,
        crystalBrilliance: workItems.crystalBrilliance,
        createdAt: workItems.createdAt,
        crystallizedAt: workItems.crystallizedAt,
        tags: workItems.tags,
        primaryDiverId: workItems.primaryDiverId,
        primaryDiverName: users.name,
        primaryDiverAvatarUrl: users.avatarUrl,
      })
      .from(workItems)
      .innerJoin(streams, eq(workItems.streamId, streams.id))
      .leftJoin(users, eq(workItems.primaryDiverId, users.id))
      .where(and(...conditions))
      .orderBy(desc(workItems.crystallizedAt))
      .limit(limit)
      .offset(offset);

    const crystals = await crystalsQuery;

    // If filtering by userId, get only crystals where user contributed
    let filteredCrystals = crystals;
    if (userId) {
      const crystalIds = crystals.map(c => c.id);
      if (crystalIds.length > 0) {
        const userContributions = await db
          .select({ workItemId: workItemContributors.workItemId })
          .from(workItemContributors)
          .where(
            and(
              eq(workItemContributors.userId, userId),
              sql`${workItemContributors.workItemId} IN ${crystalIds}`
            )
          );

        const contributedIds = new Set(userContributions.map(c => c.workItemId));
        filteredCrystals = crystals.filter(c => contributedIds.has(c.id));
      } else {
        filteredCrystals = [];
      }
    }

    // Get contributors for each crystal
    const crystalsWithContributors = await Promise.all(
      filteredCrystals.map(async (crystal) => {
        const contributors = await db
          .select({
            userId: users.id,
            name: users.name,
            avatarUrl: users.avatarUrl,
            starType: users.starType,
            energyContributed: workItemContributors.energyContributed,
            isPrimary: workItemContributors.isPrimary,
          })
          .from(workItemContributors)
          .innerJoin(users, eq(workItemContributors.userId, users.id))
          .where(eq(workItemContributors.workItemId, crystal.id))
          .orderBy(desc(workItemContributors.energyContributed));

        return {
          ...crystal,
          contributors,
        };
      })
    );

    // Get total count for pagination
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(workItems)
      .innerJoin(streams, eq(workItems.streamId, streams.id))
      .where(and(...conditions));

    const total = Number(totalResult?.count ?? 0);

    // Get aggregate stats
    const [statsResult] = await db
      .select({
        totalCrystals: sql<number>`count(*)`,
        totalBrilliance: sql<number>`sum(${workItems.crystalBrilliance})`,
        avgFacets: sql<number>`avg(${workItems.crystalFacets})`,
        avgBrilliance: sql<number>`avg(${workItems.crystalBrilliance})`,
      })
      .from(workItems)
      .innerJoin(streams, eq(workItems.streamId, streams.id))
      .where(
        and(
          eq(streams.teamId, teamId),
          eq(workItems.energyState, "crystallized")
        )
      );

    return NextResponse.json({
      crystals: crystalsWithContributors,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      stats: {
        totalCrystals: Number(statsResult?.totalCrystals ?? 0),
        totalBrilliance: Number(statsResult?.totalBrilliance ?? 0),
        avgFacets: Math.round(Number(statsResult?.avgFacets ?? 0) * 10) / 10,
        avgBrilliance: Math.round(Number(statsResult?.avgBrilliance ?? 0) * 10) / 10,
      },
    });
  } catch (error) {
    console.error("Failed to fetch crystals:", error);
    return NextResponse.json(
      { error: "Failed to fetch crystals" },
      { status: 500 }
    );
  }
}
