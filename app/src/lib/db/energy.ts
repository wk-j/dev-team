import { db } from "@/lib/db";
import { workItems, streamDivers, workItemContributors } from "@/lib/db/schema";
import { eq, or, and, isNull, count, gte, desc } from "drizzle-orm";

/**
 * Calculate a user's energy level (0-100) based on their activity
 * 
 * Formula considers:
 * - Active work items (kindling/blazing): +15 per item, max 45
 * - Crystals completed this week: +10 per crystal, max 30
 * - Active stream dives: +10 per stream, max 20
 * - Recent activity bonus: +5 if active in last hour, decays over 24h
 * - Base energy: 20 (everyone starts with some energy)
 * 
 * Max possible: 20 + 45 + 30 + 20 + 5 = 120 (capped at 100)
 */
export async function calculateEnergyLevel(userId: string): Promise<number> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Base energy
  let energy = 20;

  // 1. Active work items (kindling or blazing) - max 45 points
  const [activeItems] = await db
    .select({ count: count(workItems.id) })
    .from(workItems)
    .innerJoin(workItemContributors, eq(workItems.id, workItemContributors.workItemId))
    .where(
      and(
        eq(workItemContributors.userId, userId),
        or(
          eq(workItems.energyState, "kindling"),
          eq(workItems.energyState, "blazing")
        )
      )
    );
  energy += Math.min(45, (activeItems?.count ?? 0) * 15);

  // 2. Crystals completed this week - max 30 points
  const [crystals] = await db
    .select({ count: count(workItems.id) })
    .from(workItems)
    .where(
      and(
        eq(workItems.primaryDiverId, userId),
        eq(workItems.energyState, "crystallized"),
        gte(workItems.crystallizedAt, weekAgo)
      )
    );
  energy += Math.min(30, (crystals?.count ?? 0) * 10);

  // 3. Active stream dives - max 20 points
  const [activeDives] = await db
    .select({ count: count(streamDivers.id) })
    .from(streamDivers)
    .where(
      and(
        eq(streamDivers.userId, userId),
        isNull(streamDivers.surfacedAt)
      )
    );
  energy += Math.min(20, (activeDives?.count ?? 0) * 10);

  // 4. Recent activity bonus - check last contribution time
  const [recentContribution] = await db
    .select({ lastContributed: workItemContributors.lastContributedAt })
    .from(workItemContributors)
    .where(eq(workItemContributors.userId, userId))
    .orderBy(desc(workItemContributors.lastContributedAt))
    .limit(1);

  if (recentContribution?.lastContributed) {
    const lastActive = new Date(recentContribution.lastContributed);
    if (lastActive >= hourAgo) {
      // Active in last hour: +5
      energy += 5;
    } else if (lastActive >= dayAgo) {
      // Active in last day: decay from 5 to 0
      const hoursAgo = (now.getTime() - lastActive.getTime()) / (60 * 60 * 1000);
      energy += Math.max(0, Math.round(5 * (1 - hoursAgo / 24)));
    }
  }

  return Math.min(100, Math.max(0, energy));
}
