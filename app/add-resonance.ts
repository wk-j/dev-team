import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, or } from "drizzle-orm";
import * as schema from "./src/lib/db/schema";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

async function main() {
  console.log("✨ Setting up resonance connections...\n");

  // Get all users in the team
  const users = await db.select().from(schema.users).limit(10);
  
  if (users.length < 2) {
    console.log("❌ Need at least 2 users to create resonance connections");
    process.exit(1);
  }

  console.log(`Found ${users.length} users:`);
  users.forEach((u, i) => console.log(`  ${i + 1}. ${u.name} (${u.email})`));
  console.log("");

  // Get the team ID
  const membership = await db.query.teamMemberships.findFirst({
    where: eq(schema.teamMemberships.userId, users[0]!.id),
  });

  if (!membership) {
    console.log("❌ No team found");
    process.exit(1);
  }

  const teamId = membership.teamId;

  // Create resonance connections between all users
  let created = 0;
  
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const userA = users[i]!;
      const userB = users[j]!;

      // Check if connection already exists
      const existing = await db.query.resonanceConnections.findFirst({
        where: or(
          and(
            eq(schema.resonanceConnections.userIdA, userA.id),
            eq(schema.resonanceConnections.userIdB, userB.id)
          ),
          and(
            eq(schema.resonanceConnections.userIdA, userB.id),
            eq(schema.resonanceConnections.userIdB, userA.id)
          )
        ),
      });

      if (existing) {
        console.log(`  ⊙ Connection exists: ${userA.name} ↔ ${userB.name}`);
        continue;
      }

      // Create initial resonance connection with random score
      const resonanceScore = Math.floor(Math.random() * 40) + 30; // 30-70
      
      await db.insert(schema.resonanceConnections).values({
        teamId,
        userIdA: userA.id,
        userIdB: userB.id,
        resonanceScore,
        sharedWorkItems: 0,
        sharedStreams: 0,
        pingCount: 0,
      });

      console.log(`  ✓ Created: ${userA.name} ↔ ${userB.name} (${resonanceScore}%)`);
      created++;
    }
  }

  console.log(`\n✅ Created ${created} new resonance connections!`);
  console.log("\nRefresh http://localhost:3000/constellation to see the resonance scores!");
  
  await client.end();
}

main().catch(console.error);
