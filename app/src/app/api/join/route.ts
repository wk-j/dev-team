import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { teamInvites, teamMemberships, teams, users } from "@/lib/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";

// GET /api/join?token=xxx - Get invite info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Find invite
    const invite = await db
      .select({
        id: teamInvites.id,
        email: teamInvites.email,
        role: teamInvites.role,
        expiresAt: teamInvites.expiresAt,
        acceptedAt: teamInvites.acceptedAt,
        teamName: teams.name,
        invitedByName: users.name,
      })
      .from(teamInvites)
      .innerJoin(teams, eq(teamInvites.teamId, teams.id))
      .innerJoin(users, eq(teamInvites.invitedById, users.id))
      .where(eq(teamInvites.token, token))
      .limit(1);

    if (invite.length === 0) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    const inviteData = invite[0]!;

    if (inviteData.acceptedAt) {
      return NextResponse.json(
        { error: "This invite has already been used" },
        { status: 400 }
      );
    }

    if (new Date(inviteData.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "This invite has expired" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      teamName: inviteData.teamName,
      invitedBy: inviteData.invitedByName,
      role: inviteData.role,
      email: inviteData.email,
      expiresAt: inviteData.expiresAt,
    });
  } catch (error) {
    console.error("Error fetching invite:", error);
    return NextResponse.json(
      { error: "Failed to fetch invite" },
      { status: 500 }
    );
  }
}

// POST /api/join - Accept invite
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please log in or register first" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Find invite
    const invite = await db
      .select({
        id: teamInvites.id,
        teamId: teamInvites.teamId,
        email: teamInvites.email,
        role: teamInvites.role,
        expiresAt: teamInvites.expiresAt,
        acceptedAt: teamInvites.acceptedAt,
      })
      .from(teamInvites)
      .where(eq(teamInvites.token, token))
      .limit(1);

    if (invite.length === 0) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    const inviteData = invite[0]!;

    if (inviteData.acceptedAt) {
      return NextResponse.json(
        { error: "This invite has already been used" },
        { status: 400 }
      );
    }

    if (new Date(inviteData.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "This invite has expired" },
        { status: 400 }
      );
    }

    // Get user's email
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if email matches (optional - can be removed for flexibility)
    // if (user.email.toLowerCase() !== inviteData.email.toLowerCase()) {
    //   return NextResponse.json(
    //     { error: "This invite was sent to a different email address" },
    //     { status: 403 }
    //   );
    // }

    // Check if user is already in this team
    const existingMembership = await db.query.teamMemberships.findFirst({
      where: and(
        eq(teamMemberships.userId, session.user.id),
        eq(teamMemberships.teamId, inviteData.teamId)
      ),
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "You are already a member of this team" },
        { status: 400 }
      );
    }

    // Remove user from their current team (if any)
    await db
      .delete(teamMemberships)
      .where(eq(teamMemberships.userId, session.user.id));

    // Add user to new team
    await db.insert(teamMemberships).values({
      userId: session.user.id,
      teamId: inviteData.teamId,
      role: inviteData.role,
    });

    // Mark invite as accepted
    await db
      .update(teamInvites)
      .set({ acceptedAt: new Date() })
      .where(eq(teamInvites.id, inviteData.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error accepting invite:", error);
    return NextResponse.json(
      { error: "Failed to accept invite" },
      { status: 500 }
    );
  }
}
