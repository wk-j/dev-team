import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resonancePings, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/pings/[id] - Get a specific ping
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const ping = await db
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
        fromUserId: resonancePings.fromUserId,
        toUserId: resonancePings.toUserId,
      })
      .from(resonancePings)
      .where(eq(resonancePings.id, id))
      .limit(1);

    if (ping.length === 0) {
      return NextResponse.json({ error: "Ping not found" }, { status: 404 });
    }

    const pingData = ping[0];
    
    // Check if user has access to this ping
    if (pingData && pingData.fromUserId !== session.user.id && pingData.toUserId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get from user details
    const fromUser = await db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        starType: users.starType,
        orbitalState: users.orbitalState,
        energySignatureColor: users.energySignatureColor,
      })
      .from(users)
      .where(eq(users.id, pingData?.fromUserId ?? ""))
      .limit(1);

    // Get to user details
    const toUser = await db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        starType: users.starType,
        orbitalState: users.orbitalState,
        energySignatureColor: users.energySignatureColor,
      })
      .from(users)
      .where(eq(users.id, pingData?.toUserId ?? ""))
      .limit(1);

    return NextResponse.json({
      ...pingData,
      fromUser: fromUser[0],
      toUser: toUser[0],
    });
  } catch (error) {
    console.error("Error fetching ping:", error);
    return NextResponse.json(
      { error: "Failed to fetch ping" },
      { status: 500 }
    );
  }
}

// PATCH /api/pings/[id] - Update ping status (mark as read)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !["delivered", "read"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'delivered' or 'read'" },
        { status: 400 }
      );
    }

    // Get the ping
    const ping = await db
      .select()
      .from(resonancePings)
      .where(eq(resonancePings.id, id))
      .limit(1);

    if (ping.length === 0) {
      return NextResponse.json({ error: "Ping not found" }, { status: 404 });
    }

    const pingData = ping[0];
    
    // Can only update pings addressed to you
    if (pingData && pingData.toUserId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update the ping
    const updateData: Record<string, unknown> = { status };
    if (status === "delivered") {
      updateData.deliveredAt = new Date();
    } else if (status === "read") {
      updateData.readAt = new Date();
    }

    const [updatedPing] = await db
      .update(resonancePings)
      .set(updateData)
      .where(eq(resonancePings.id, id))
      .returning();

    return NextResponse.json(updatedPing);
  } catch (error) {
    console.error("Error updating ping:", error);
    return NextResponse.json(
      { error: "Failed to update ping" },
      { status: 500 }
    );
  }
}

// DELETE /api/pings/[id] - Delete a ping (sender only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get the ping
    const ping = await db
      .select()
      .from(resonancePings)
      .where(eq(resonancePings.id, id))
      .limit(1);

    if (ping.length === 0) {
      return NextResponse.json({ error: "Ping not found" }, { status: 404 });
    }

    const pingData = ping[0];
    
    // Can only delete pings you sent
    if (pingData && pingData.fromUserId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db
      .delete(resonancePings)
      .where(eq(resonancePings.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ping:", error);
    return NextResponse.json(
      { error: "Failed to delete ping" },
      { status: 500 }
    );
  }
}
