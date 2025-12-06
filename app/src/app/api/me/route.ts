import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, teamMemberships, teams } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { StarType, OrbitalState, UserPreferences } from "@/lib/db/schema";

// GET /api/me - Get current user profile
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get team info
    let membership = await db
      .select({
        teamId: teamMemberships.teamId,
        role: teamMemberships.role,
        teamName: teams.name,
      })
      .from(teamMemberships)
      .innerJoin(teams, eq(teamMemberships.teamId, teams.id))
      .where(eq(teamMemberships.userId, session.user.id))
      .limit(1);

    // Auto-create a team for users without one
    if (membership.length === 0) {
      const [newTeam] = await db.insert(teams).values({
        name: `${user.name}'s Space`,
        description: "Your personal workspace in the void",
      }).returning();

      await db.insert(teamMemberships).values({
        userId: user.id,
        teamId: newTeam!.id,
        role: "owner",
      });

      membership = [{
        teamId: newTeam!.id,
        role: "owner",
        teamName: newTeam!.name,
      }];
    }

    // Don't return password hash
    const { passwordHash, ...safeUser } = user;

    return NextResponse.json({
      ...safeUser,
      team: membership[0] ?? null,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PATCH /api/me - Update current user profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      avatarUrl,
      role,
      starType,
      energySignatureColor,
      orbitalState,
      sanctumTheme,
      preferences,
    } = body;

    const updateData: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };

    // Validate and add fields
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 1) {
        return NextResponse.json(
          { error: "Name must be at least 1 character" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl ?? null;
    }

    if (role !== undefined) {
      updateData.role = role ?? null;
    }

    if (starType !== undefined) {
      const validStarTypes: StarType[] = ["sun", "giant", "main_sequence", "dwarf", "neutron"];
      if (!validStarTypes.includes(starType)) {
        return NextResponse.json(
          { error: "Invalid star type" },
          { status: 400 }
        );
      }
      updateData.starType = starType;
    }

    if (energySignatureColor !== undefined) {
      // Validate hex color
      if (!/^#[0-9A-Fa-f]{6}$/.test(energySignatureColor)) {
        return NextResponse.json(
          { error: "Invalid color format. Use #RRGGBB" },
          { status: 400 }
        );
      }
      updateData.energySignatureColor = energySignatureColor;
    }

    if (orbitalState !== undefined) {
      const validStates: OrbitalState[] = ["open", "focused", "deep_work", "away", "supernova"];
      if (!validStates.includes(orbitalState)) {
        return NextResponse.json(
          { error: "Invalid orbital state" },
          { status: 400 }
        );
      }
      updateData.orbitalState = orbitalState;
      updateData.lastActiveAt = new Date();
    }

    if (sanctumTheme !== undefined) {
      updateData.sanctumTheme = sanctumTheme;
    }

    if (preferences !== undefined) {
      // Merge with existing preferences
      const existingUser = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { preferences: true },
      });

      const existingPrefs = existingUser?.preferences ?? getDefaultPreferences();
      updateData.preferences = {
        ...existingPrefs,
        ...preferences,
      } as UserPreferences;
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, session.user.id))
      .returning();

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Don't return password hash
    const { passwordHash, ...safeUser } = updatedUser;

    return NextResponse.json(safeUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

function getDefaultPreferences(): UserPreferences {
  return {
    dailyCheckInEnabled: true,
    weeklyReflectionEnabled: true,
    pingDelivery: {
      gentle: "batch_hourly",
      warm: "when_open",
      direct: "always",
    },
    visualPowers: {
      particleDensity: 1.0,
      glowIntensity: 1.0,
      animationSpeed: "normal",
    },
    accessibility: {
      highContrast: false,
      reducedMotion: false,
      classicView: false,
    },
  };
}
