import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { teamInvites, teamMemberships, teams, users } from "@/lib/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import crypto from "crypto";

// GET /api/team/invites - List pending invites
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

    // Get pending invites
    const invites = await db
      .select({
        id: teamInvites.id,
        email: teamInvites.email,
        role: teamInvites.role,
        createdAt: teamInvites.createdAt,
        expiresAt: teamInvites.expiresAt,
        invitedBy: {
          id: users.id,
          name: users.name,
        },
      })
      .from(teamInvites)
      .innerJoin(users, eq(teamInvites.invitedById, users.id))
      .where(
        and(
          eq(teamInvites.teamId, membership.teamId),
          isNull(teamInvites.acceptedAt),
          gt(teamInvites.expiresAt, new Date())
        )
      );

    return NextResponse.json(invites);
  } catch (error) {
    console.error("Error fetching invites:", error);
    return NextResponse.json(
      { error: "Failed to fetch invites" },
      { status: 500 }
    );
  }
}

// POST /api/team/invites - Create new invite
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, role = "member" } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const validRoles = ["admin", "member"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Get user's team membership
    const membership = await db.query.teamMemberships.findFirst({
      where: eq(teamMemberships.userId, session.user.id),
    });

    if (!membership) {
      return NextResponse.json({ error: "No team found" }, { status: 404 });
    }

    // Only owners and admins can invite
    if (membership.role !== "owner" && membership.role !== "admin") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Check if user is already a member
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (existingUser) {
      const existingMembership = await db.query.teamMemberships.findFirst({
        where: and(
          eq(teamMemberships.userId, existingUser.id),
          eq(teamMemberships.teamId, membership.teamId)
        ),
      });

      if (existingMembership) {
        return NextResponse.json(
          { error: "User is already a team member" },
          { status: 400 }
        );
      }
    }

    // Check for existing pending invite
    const existingInvite = await db.query.teamInvites.findFirst({
      where: and(
        eq(teamInvites.teamId, membership.teamId),
        eq(teamInvites.email, email.toLowerCase()),
        isNull(teamInvites.acceptedAt),
        gt(teamInvites.expiresAt, new Date())
      ),
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: "Invite already pending for this email" },
        { status: 400 }
      );
    }

    // Generate invite token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const [invite] = await db
      .insert(teamInvites)
      .values({
        teamId: membership.teamId,
        email: email.toLowerCase(),
        role,
        invitedById: session.user.id,
        token,
        expiresAt,
      })
      .returning();

    // Get team name for response
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, membership.teamId),
    });

    return NextResponse.json({
      ...invite,
      teamName: team?.name,
      inviteLink: `/join?token=${token}`,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }
}

// DELETE /api/team/invites - Cancel invite
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const inviteId = searchParams.get("inviteId");

    if (!inviteId) {
      return NextResponse.json(
        { error: "Invite ID is required" },
        { status: 400 }
      );
    }

    // Get user's team membership
    const membership = await db.query.teamMemberships.findFirst({
      where: eq(teamMemberships.userId, session.user.id),
    });

    if (!membership) {
      return NextResponse.json({ error: "No team found" }, { status: 404 });
    }

    // Only owners and admins can cancel invites
    if (membership.role !== "owner" && membership.role !== "admin") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    await db
      .delete(teamInvites)
      .where(
        and(
          eq(teamInvites.id, inviteId),
          eq(teamInvites.teamId, membership.teamId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error canceling invite:", error);
    return NextResponse.json(
      { error: "Failed to cancel invite" },
      { status: 500 }
    );
  }
}
