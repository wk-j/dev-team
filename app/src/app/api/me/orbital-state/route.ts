import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, resonancePings, type OrbitalState } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// PATCH /api/me/orbital-state - Update user's orbital state
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orbitalState } = body;

    if (!orbitalState) {
      return NextResponse.json(
        { error: "orbitalState is required" },
        { status: 400 }
      );
    }

    // Validate orbital state
    const validStates: OrbitalState[] = ["open", "focused", "deep_work", "away", "supernova"];
    if (!validStates.includes(orbitalState)) {
      return NextResponse.json(
        { error: "Invalid orbital state. Must be one of: open, focused, deep_work, away, supernova" },
        { status: 400 }
      );
    }

    // Get current user to check previous state
    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const previousState = currentUser.orbitalState;

    // Update orbital state
    const [updatedUser] = await db
      .update(users)
      .set({
        orbitalState,
        lastActiveAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))
      .returning();

    if (!updatedUser) {
      return NextResponse.json({ error: "Failed to update orbital state" }, { status: 500 });
    }

    // If changing FROM deep_work, deliver queued gentle pings
    if (previousState === "deep_work" && orbitalState !== "deep_work") {
      await db
        .update(resonancePings)
        .set({
          status: "delivered",
          deliveredAt: new Date(),
        })
        .where(
          and(
            eq(resonancePings.toUserId, session.user.id),
            eq(resonancePings.status, "sent"),
            eq(resonancePings.type, "gentle")
          )
        );
    }

    // Don't return password hash
    const { passwordHash, ...safeUser } = updatedUser;

    return NextResponse.json({
      user: safeUser,
      previousState,
      message: previousState === "deep_work" && orbitalState !== "deep_work"
        ? "Orbital state updated. Queued gentle pings have been delivered."
        : "Orbital state updated successfully",
    });
  } catch (error) {
    console.error("Error updating orbital state:", error);
    return NextResponse.json(
      { error: "Failed to update orbital state" },
      { status: 500 }
    );
  }
}
