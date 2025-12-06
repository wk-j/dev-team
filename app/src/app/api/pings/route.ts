import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resonancePings, users, teamMemberships, resonanceConnections } from "@/lib/db/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";

// GET /api/pings - Get user's ping inbox
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ pings: [], unreadCount: 0 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status"); // sent, delivered, read, expired
    const type = searchParams.get("type"); // gentle, warm, direct
    const direction = searchParams.get("direction") ?? "received"; // received, sent

    // Build query conditions
    const conditions = [];
    
    if (direction === "received") {
      conditions.push(eq(resonancePings.toUserId, session.user.id));
    } else {
      conditions.push(eq(resonancePings.fromUserId, session.user.id));
    }
    
    if (status) {
      conditions.push(eq(resonancePings.status, status as "sent" | "delivered" | "read" | "expired"));
    }
    
    if (type) {
      conditions.push(eq(resonancePings.type, type as "gentle" | "warm" | "direct"));
    }

    const pings = await db
      .select({
        id: resonancePings.id,
        type: resonancePings.type,
        status: resonancePings.status,
        message: resonancePings.message,
        relatedWorkItemId: resonancePings.relatedWorkItemId,
        relatedStreamId: resonancePings.relatedStreamId,
        sentAt: resonancePings.sentAt,
        deliveredAt: resonancePings.deliveredAt,
        readAt: resonancePings.readAt,
        expiresAt: resonancePings.expiresAt,
        fromUser: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl,
          starType: users.starType,
          orbitalState: users.orbitalState,
          energySignatureColor: users.energySignatureColor,
        },
      })
      .from(resonancePings)
      .innerJoin(users, eq(resonancePings.fromUserId, users.id))
      .where(and(...conditions))
      .orderBy(desc(resonancePings.sentAt))
      .limit(50);

    // Mark delivered pings as delivered
    if (direction === "received") {
      const undeliveredIds = pings
        .filter(p => p.status === "sent")
        .map(p => p.id);
      
      if (undeliveredIds.length > 0) {
        await db
          .update(resonancePings)
          .set({ 
            status: "delivered",
            deliveredAt: new Date(),
          })
          .where(
            and(
              eq(resonancePings.toUserId, session.user.id),
              eq(resonancePings.status, "sent")
            )
          );
      }
    }

    // Calculate unread count
    const unreadCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(resonancePings)
      .where(
        and(
          eq(resonancePings.toUserId, session.user.id),
          or(
            eq(resonancePings.status, "sent"),
            eq(resonancePings.status, "delivered")
          )
        )
      );

    return NextResponse.json({
      pings,
      unreadCount: unreadCount[0]?.count ?? 0,
    });
  } catch (error) {
    console.error("Error fetching pings:", error);
    return NextResponse.json(
      { error: "Failed to fetch pings" },
      { status: 500 }
    );
  }
}

// POST /api/pings - Send a new ping
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { toUserId, type, message, relatedWorkItemId, relatedStreamId } = body;

    if (!toUserId || !type) {
      return NextResponse.json(
        { error: "toUserId and type are required" },
        { status: 400 }
      );
    }

    if (!["gentle", "warm", "direct"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid ping type" },
        { status: 400 }
      );
    }

    // Can't ping yourself
    if (toUserId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot ping yourself" },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUser = await db
      .select()
      .from(users)
      .where(eq(users.id, toUserId))
      .limit(1);

    if (targetUser.length === 0) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );
    }

    // Check if both users are in the same team
    const senderMembership = await db
      .select({ teamId: teamMemberships.teamId })
      .from(teamMemberships)
      .where(eq(teamMemberships.userId, session.user.id))
      .limit(1);

    const receiverMembership = await db
      .select({ teamId: teamMemberships.teamId })
      .from(teamMemberships)
      .where(eq(teamMemberships.userId, toUserId))
      .limit(1);

    if (
      senderMembership.length === 0 ||
      receiverMembership.length === 0 ||
      senderMembership[0]?.teamId !== receiverMembership[0]?.teamId
    ) {
      return NextResponse.json(
        { error: "Can only ping team members" },
        { status: 403 }
      );
    }

    // Check if user is in deep_work and ping type isn't direct
    const target = targetUser[0];
    if (target && target.orbitalState === "deep_work" && type !== "direct") {
      return NextResponse.json(
        { error: "User is in deep work. Only direct pings allowed." },
        { status: 403 }
      );
    }

    // Calculate expiry based on ping type
    let expiresAt: Date | null = null;
    const now = new Date();
    if (type === "gentle") {
      expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    } else if (type === "warm") {
      expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours
    }
    // Direct pings don't expire

    // Create the ping
    const [newPing] = await db
      .insert(resonancePings)
      .values({
        fromUserId: session.user.id,
        toUserId,
        type,
        message: message ?? null,
        relatedWorkItemId: relatedWorkItemId ?? null,
        relatedStreamId: relatedStreamId ?? null,
        expiresAt,
      })
      .returning();

    // Update resonance connection
    const teamId = senderMembership[0]?.teamId;
    if (teamId) {
      // Get or create resonance connection
      const existingConnection = await db
        .select()
        .from(resonanceConnections)
        .where(
          or(
            and(
              eq(resonanceConnections.userIdA, session.user.id),
              eq(resonanceConnections.userIdB, toUserId)
            ),
            and(
              eq(resonanceConnections.userIdA, toUserId),
              eq(resonanceConnections.userIdB, session.user.id)
            )
          )
        )
        .limit(1);

      if (existingConnection.length > 0 && existingConnection[0]) {
        // Update existing connection
        await db
          .update(resonanceConnections)
          .set({
            pingCount: sql`${resonanceConnections.pingCount} + 1`,
            resonanceScore: sql`LEAST(100, ${resonanceConnections.resonanceScore} + 2)`,
            lastInteractionAt: new Date(),
          })
          .where(eq(resonanceConnections.id, existingConnection[0].id));
      } else {
        // Create new connection
        await db.insert(resonanceConnections).values({
          teamId,
          userIdA: session.user.id,
          userIdB: toUserId,
          pingCount: 1,
          resonanceScore: 5,
        });
      }
    }

    // Get sender info for response
    const sender = await db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        starType: users.starType,
        orbitalState: users.orbitalState,
        energySignatureColor: users.energySignatureColor,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    return NextResponse.json({
      ping: {
        ...newPing,
        fromUser: sender[0],
      },
    });
  } catch (error) {
    console.error("Error sending ping:", error);
    return NextResponse.json(
      { error: "Failed to send ping" },
      { status: 500 }
    );
  }
}
