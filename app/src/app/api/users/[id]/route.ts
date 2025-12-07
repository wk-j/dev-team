import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, teamMemberships, workItemContributors, resonanceConnections, workItems, streamDivers, streams } from "@/lib/db/schema";
import { eq, or, and, isNull, count, gte } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const session = await auth();
  const { id } = await context.params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = id;

    // Get user
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.id, userId),
        isNull(users.deletedAt)
      ),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get current user's team membership to verify same team
    const currentUserMembership = await db.query.teamMemberships.findFirst({
      where: eq(teamMemberships.userId, session.user.id),
    });

    if (!currentUserMembership) {
      return NextResponse.json({ error: "No team found" }, { status: 404 });
    }

    // Get target user's membership in the same team
    const targetUserMembership = await db.query.teamMemberships.findFirst({
      where: and(
        eq(teamMemberships.userId, userId),
        eq(teamMemberships.teamId, currentUserMembership.teamId)
      ),
    });

    if (!targetUserMembership) {
      return NextResponse.json(
        { error: "User not in your team" },
        { status: 403 }
      );
    }

    // Get contribution stats
    const [contributionStats] = await db
      .select({
        totalContributions: count(workItemContributors.id),
      })
      .from(workItemContributors)
      .where(eq(workItemContributors.userId, userId));

    // Get crystals this week (crystallized work items)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const [crystalsThisWeek] = await db
      .select({
        count: count(workItems.id),
      })
      .from(workItems)
      .where(
        and(
          eq(workItems.primaryDiverId, userId),
          eq(workItems.energyState, "crystallized"),
          gte(workItems.crystallizedAt, weekAgo)
        )
      );

    // Get active streams (currently diving)
    const [activeStreams] = await db
      .select({
        count: count(streamDivers.id),
      })
      .from(streamDivers)
      .where(
        and(
          eq(streamDivers.userId, userId),
          isNull(streamDivers.surfacedAt)
        )
      );

    // Get resonance connection with current user
    let resonanceScore = 0;
    if (userId !== session.user.id) {
      const connection = await db.query.resonanceConnections.findFirst({
        where: or(
          and(
            eq(resonanceConnections.userIdA, session.user.id),
            eq(resonanceConnections.userIdB, userId)
          ),
          and(
            eq(resonanceConnections.userIdA, userId),
            eq(resonanceConnections.userIdB, session.user.id)
          )
        ),
      });
      resonanceScore = connection?.resonanceScore ?? 0;
    }

    // Don't return password hash
    const { passwordHash, ...safeUser } = user;

    return NextResponse.json({
      ...safeUser,
      membershipRole: targetUserMembership.role,
      joinedAt: targetUserMembership.joinedAt,
      stats: {
        totalContributions: contributionStats?.totalContributions ?? 0,
        crystalsThisWeek: Number(crystalsThisWeek?.count ?? 0),
        activeStreams: Number(activeStreams?.count ?? 0),
        resonanceScore,
      },
    });
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
