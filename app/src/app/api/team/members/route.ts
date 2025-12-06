import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { teamMemberships, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// DELETE /api/team/members - Remove a member from team
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }

    // Get current user's team membership
    const currentMembership = await db.query.teamMemberships.findFirst({
      where: eq(teamMemberships.userId, session.user.id),
    });

    if (!currentMembership) {
      return NextResponse.json({ error: "No team found" }, { status: 404 });
    }

    // Only owners and admins can remove members
    if (currentMembership.role !== "owner" && currentMembership.role !== "admin") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Get target member's membership
    const targetMembership = await db.query.teamMemberships.findFirst({
      where: and(
        eq(teamMemberships.userId, memberId),
        eq(teamMemberships.teamId, currentMembership.teamId)
      ),
    });

    if (!targetMembership) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Can't remove yourself
    if (memberId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot remove yourself. Transfer ownership first." },
        { status: 400 }
      );
    }

    // Admins can't remove owners
    if (targetMembership.role === "owner" && currentMembership.role !== "owner") {
      return NextResponse.json(
        { error: "Only owners can remove other owners" },
        { status: 403 }
      );
    }

    // Remove the member
    await db
      .delete(teamMemberships)
      .where(
        and(
          eq(teamMemberships.userId, memberId),
          eq(teamMemberships.teamId, currentMembership.teamId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}

// PATCH /api/team/members - Update member role
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { memberId, role } = body;

    if (!memberId || !role) {
      return NextResponse.json(
        { error: "Member ID and role are required" },
        { status: 400 }
      );
    }

    const validRoles = ["owner", "admin", "member"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Get current user's team membership
    const currentMembership = await db.query.teamMemberships.findFirst({
      where: eq(teamMemberships.userId, session.user.id),
    });

    if (!currentMembership) {
      return NextResponse.json({ error: "No team found" }, { status: 404 });
    }

    // Only owners can change roles
    if (currentMembership.role !== "owner") {
      return NextResponse.json({ error: "Only owners can change roles" }, { status: 403 });
    }

    // Update member role
    const [updated] = await db
      .update(teamMemberships)
      .set({ role })
      .where(
        and(
          eq(teamMemberships.userId, memberId),
          eq(teamMemberships.teamId, currentMembership.teamId)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}
