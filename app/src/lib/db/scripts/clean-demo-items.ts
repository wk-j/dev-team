import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as schema from "../schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function cleanDemoItems() {
  try {
    console.log("🧹 Cleaning demo work items...\n");
    
    // Delete work items added by the demo script (those with titles like "Implement X feature")
    const result = await db.delete(schema.workItems)
      .where(sql`${schema.workItems.title} LIKE 'Implement %' OR ${schema.workItems.title} LIKE 'Test %' OR ${schema.workItems.title} LIKE 'Document %' OR ${schema.workItems.title} LIKE '%v1.0 Release'`)
      .returning({ id: schema.workItems.id });
    
    console.log(`   ✓ Deleted ${result.length} demo work items`);

    // Reset stream counts to 0
    await db.update(schema.streams)
      .set({ itemCount: 0, crystalCount: 0 });
    
    console.log(`   ✓ Reset stream counts\n`);
    console.log("✅ Cleanup complete! Your streams are ready for real data.");
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

cleanDemoItems();
