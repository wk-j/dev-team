import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, teamMemberships, resonanceConnections, workItems, streamDivers, workItemContributors } from "@/lib/db/schema";
import { eq, or, and, isNull, count, gte, sql } from "drizzle-orm";
import { calculateEnergyLevel } from "@/lib/db/energy";

// GET /api/users - List team members
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

    // Get all team members
    const teamMembers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
        role: users.role,
        starType: users.starType,
        energySignatureColor: users.energySignatureColor,
        orbitalState: users.orbitalState,
        positionX: users.positionX,
        positionY: users.positionY,
        positionZ: users.positionZ,
        currentEnergyLevel: users.currentEnergyLevel,
        lastActiveAt: users.lastActiveAt,
        createdAt: users.createdAt,
        membershipRole: teamMemberships.role,
        joinedAt: teamMemberships.joinedAt,
      })
      .from(users)
      .innerJoin(teamMemberships, eq(users.id, teamMemberships.userId))
      .where(
        and(
          eq(teamMemberships.teamId, membership.teamId),
          isNull(users.deletedAt)
        )
      )
      .orderBy(teamMemberships.joinedAt);

    // Get resonance scores for current user with other team members
    const currentUserId = session.user.id;
    const resonanceScores = await db
      .select({
        userId: resonanceConnections.userIdA,
        otherUserId: resonanceConnections.userIdB,
        score: resonanceConnections.resonanceScore,
      })
      .from(resonanceConnections)
      .where(
        or(
          eq(resonanceConnections.userIdA, currentUserId),
          eq(resonanceConnections.userIdB, currentUserId)
        )
      );

    // Create a map of user ID to resonance score
    const resonanceMap = new Map<string, number>();
    for (const conn of resonanceScores) {
      const otherUserId = conn.userId === currentUserId ? conn.otherUserId : conn.userId;
      resonanceMap.set(otherUserId, conn.score);
    }

    // Get crystals, active streams, and calculated energy for each member
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const membersWithStats = await Promise.all(
      teamMembers.map(async (member) => {
        // Get crystals this week
        const [crystals] = await db
          .select({ count: count(workItems.id) })
          .from(workItems)
          .where(
            and(
              eq(workItems.primaryDiverId, member.id),
              eq(workItems.energyState, "crystallized"),
              gte(workItems.crystallizedAt, weekAgo)
            )
          );

        // Get active streams
        const [activeStreams] = await db
          .select({ count: count(streamDivers.id) })
          .from(streamDivers)
          .where(
            and(
              eq(streamDivers.userId, member.id),
              isNull(streamDivers.surfacedAt)
            )
          );

        // Get active work items (kindling or blazing) for dynamic star visualization
        const [activeWorkItems] = await db
          .select({ count: count(workItems.id) })
          .from(workItems)
          .innerJoin(workItemContributors, eq(workItems.id, workItemContributors.workItemId))
          .where(
            and(
              eq(workItemContributors.userId, member.id),
              or(
                eq(workItems.energyState, "kindling"),
                eq(workItems.energyState, "blazing")
              )
            )
          );

        // Calculate dynamic energy level
        const calculatedEnergy = await calculateEnergyLevel(member.id);

        return {
          ...member,
          currentEnergyLevel: calculatedEnergy, // Override static value with calculated
          resonanceScore: member.id === currentUserId ? null : (resonanceMap.get(member.id) ?? 0),
          crystalsThisWeek: Number(crystals?.count ?? 0),
          activeStreams: Number(activeStreams?.count ?? 0),
          activeWorkItems: Number(activeWorkItems?.count ?? 0), // For dynamic star visualization
        };
      })
    );

    return NextResponse.json(membersWithStats);
  } catch (error) {
    console.error("Failed to fetch team members:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}
