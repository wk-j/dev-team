import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as schema from "./src/lib/db/schema";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

async function main() {
  console.log("🚀 Adding real work items to your streams...\n");

  // Get "Index Mapper Tools" stream
  const stream = await db.query.streams.findFirst({
    where: eq(schema.streams.name, "Index Mapper Tools")
  });

  if (!stream) {
    console.error("❌ Stream 'Index Mapper Tools' not found!");
    process.exit(1);
  }

  const items = [
    {
      streamId: stream.id,
      title: "Setup development environment",
      description: "Install dependencies and configure tooling",
      energyState: "crystallized" as const,
      energyLevel: 100,
      depth: "shallow" as const,
      streamPosition: 0.9,
      crystallizedAt: new Date(),
      crystalFacets: 1,
      crystalBrilliance: 75,
    },
    {
      streamId: stream.id,
      title: "Implement JSON schema validation",
      description: "Validate incoming JSON against defined schema",
      energyState: "blazing" as const,
      energyLevel: 65,
      depth: "medium" as const,
      streamPosition: 0.6,
      kindledAt: new Date(),
    },
    {
      streamId: stream.id,
      title: "Write API documentation",
      description: "Document all endpoints and data models",
      energyState: "dormant" as const,
      energyLevel: 0,
      depth: "shallow" as const,
      streamPosition: 0.3,
    },
  ];

  for (const item of items) {
    await db.insert(schema.workItems).values(item);
    console.log(`  ✓ Created: ${item.title}`);
  }

  await db.update(schema.streams)
    .set({ 
      itemCount: stream.itemCount + items.length,
      crystalCount: stream.crystalCount + 1,
      updatedAt: new Date()
    })
    .where(eq(schema.streams.id, stream.id));

  console.log(`\n✅ Added ${items.length} work items to "${stream.name}"!`);
  console.log("   - 1 active (blazing) ⚡");
  console.log("   - 1 completed (crystal) 💎");
  console.log("   - 1 not started (dormant) ○");
  console.log("\nRefresh http://localhost:3000/streams to see them!");
  
  await client.end();
}

main().catch(console.error);
