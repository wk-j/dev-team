import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as schema from "../schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function addWorkItems() {
  try {
    // Get existing streams
    const streams = await db.select().from(schema.streams).limit(10);
    console.log(`Found ${streams.length} streams`);
    
    if (streams.length === 0) {
      console.log("No streams found!");
      return;
    }

    // Get a user to assign as primary diver
    const users = await db.select().from(schema.users).limit(1);
    const primaryDiver = users[0];

    for (const stream of streams) {
      console.log(`\nAdding work items to stream: ${stream.name}`);
      
      // Add 3-4 work items per stream
      const items = [
        {
          streamId: stream.id,
          title: `Implement ${stream.name} feature`,
          description: "Core feature implementation",
          energyState: "blazing" as const,
          energyLevel: 75,
          depth: "deep" as const,
          streamPosition: 0.6,
          primaryDiverId: primaryDiver?.id,
          kindledAt: new Date(),
        },
        {
          streamId: stream.id,
          title: `Test ${stream.name}`,
          description: "Unit and integration tests",
          energyState: "kindling" as const,
          energyLevel: 30,
          depth: "medium" as const,
          streamPosition: 0.4,
          primaryDiverId: primaryDiver?.id,
          kindledAt: new Date(),
        },
        {
          streamId: stream.id,
          title: `Document ${stream.name}`,
          description: "API documentation and guides",
          energyState: "dormant" as const,
          energyLevel: 0,
          depth: "shallow" as const,
          streamPosition: 0.2,
        },
        {
          streamId: stream.id,
          title: `${stream.name} v1.0 Release`,
          description: "First production release",
          energyState: "crystallized" as const,
          energyLevel: 100,
          depth: "deep" as const,
          streamPosition: 0.9,
          primaryDiverId: primaryDiver?.id,
          kindledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          crystallizedAt: new Date(),
          crystalFacets: 3,
          crystalBrilliance: 85,
        },
      ];

      for (const item of items) {
        await db.insert(schema.workItems).values(item);
      }

      // Update stream counts
      await db.update(schema.streams)
        .set({ 
          itemCount: items.length, 
          crystalCount: 1  // One crystallized item
        })
        .where(eq(schema.streams.id, stream.id));

      console.log(`  ✓ Added ${items.length} work items`);
    }

    console.log("\n✅ Work items added successfully!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

addWorkItems();
