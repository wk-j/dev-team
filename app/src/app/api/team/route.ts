import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { teams, teamMemberships, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/team - Get current user's team with members
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's team membership
    const membership = await db.query.teamMemberships.findFirst({
      where: eq(teamMemberships.userId, session.user.id),
    });

    if (!membership) {
      return NextResponse.json({ error: "No team found" }, { status: 404 });
    }

    // Get team details
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, membership.teamId),
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Get all team members
    const members = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: teamMemberships.role,
        avatarUrl: users.avatarUrl,
        userRole: users.role,
        starType: users.starType,
        orbitalState: users.orbitalState,
        energySignatureColor: users.energySignatureColor,
        joinedAt: teamMemberships.joinedAt,
        lastActiveAt: users.lastActiveAt,
      })
      .from(teamMemberships)
      .innerJoin(users, eq(teamMemberships.userId, users.id))
      .where(eq(teamMemberships.teamId, membership.teamId));

    return NextResponse.json({
      ...team,
      currentUserRole: membership.role,
      members,
    });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}

// PATCH /api/team - Update team details
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's team membership
    const membership = await db.query.teamMemberships.findFirst({
      where: eq(teamMemberships.userId, session.user.id),
    });

    if (!membership) {
      return NextResponse.json({ error: "No team found" }, { status: 404 });
    }

    // Only owners and admins can update team
    if (membership.role !== "owner" && membership.role !== "admin") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description } = body;

    const updateData: Partial<typeof teams.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 1) {
        return NextResponse.json(
          { error: "Name must be at least 1 character" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    const [updatedTeam] = await db
      .update(teams)
      .set(updateData)
      .where(eq(teams.id, membership.teamId))
      .returning();

    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 }
    );
  }
}
