"use server";

import { db } from "@/lib/db";
import { users, teams, teamMemberships } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface RegisterState {
    error?: string;
    success?: boolean;
}

export async function registerUser(
    prevState: RegisterState,
    formData: FormData
): Promise<RegisterState> {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Validation
    if (!name || name.trim().length < 2) {
        return { error: "Name must be at least 2 characters" };
    }

    if (!email || !email.includes("@")) {
        return { error: "Please enter a valid email address" };
    }

    if (!password || password.length < 8) {
        return { error: "Password must be at least 8 characters" };
    }

    try {
        // Check if user already exists
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email.toLowerCase()),
        });

        if (existingUser) {
            return { error: "An account with this email already exists" };
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Generate random position in void for the user's celestial presence
        const positionX = (Math.random() - 0.5) * 100;
        const positionY = (Math.random() - 0.5) * 100;
        const positionZ = (Math.random() - 0.5) * 50;

        // Generate a random energy signature color
        const energyColors = [
            "#00d4ff", // Electric Cyan
            "#ff6b9d", // Warm Pink
            "#a855f7", // Purple
            "#10b981", // Emerald
            "#f59e0b", // Amber
            "#3b82f6", // Blue
        ];
        const energySignatureColor =
            energyColors[Math.floor(Math.random() * energyColors.length)];

        // Create user
        const [newUser] = await db.insert(users).values({
            name: name.trim(),
            email: email.toLowerCase(),
            passwordHash,
            positionX,
            positionY,
            positionZ,
            energySignatureColor,
            starType: "main_sequence",
            orbitalState: "open",
            currentEnergyLevel: 100,
        }).returning();

        // Create a personal team for the user
        const [newTeam] = await db.insert(teams).values({
            name: `${name.trim()}'s Space`,
            description: "Your personal workspace in the void",
        }).returning();

        // Add user as team owner
        await db.insert(teamMemberships).values({
            userId: newUser!.id,
            teamId: newTeam!.id,
            role: "owner",
        });

        return { success: true };
    } catch (error) {
        console.error("Registration error:", error);
        return { error: "Something went wrong. Please try again." };
    }
}
