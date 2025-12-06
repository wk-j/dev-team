import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { teamInvites, teams, users } from "@/lib/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";

// GET /api/me/invites - Get pending invites for current user's email
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's email
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find pending invites for this email
    const invites = await db
      .select({
        id: teamInvites.id,
        token: teamInvites.token,
        email: teamInvites.email,
        role: teamInvites.role,
        createdAt: teamInvites.createdAt,
        expiresAt: teamInvites.expiresAt,
        teamId: teamInvites.teamId,
        teamName: teams.name,
        invitedByName: users.name,
      })
      .from(teamInvites)
      .innerJoin(teams, eq(teamInvites.teamId, teams.id))
      .innerJoin(users, eq(teamInvites.invitedById, users.id))
      .where(
        and(
          eq(teamInvites.email, user.email.toLowerCase()),
          isNull(teamInvites.acceptedAt),
          gt(teamInvites.expiresAt, new Date())
        )
      );

    return NextResponse.json(invites);
  } catch (error) {
    console.error("Error fetching user invites:", error);
    return NextResponse.json(
      { error: "Failed to fetch invites" },
      { status: 500 }
    );
  }
}
