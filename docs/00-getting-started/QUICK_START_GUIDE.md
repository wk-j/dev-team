# FlowState - Quick Start Guide: Adding Work Items

## 🎯 How to Add Real Work Items

There are **3 ways** to add work items to your streams:

---

## Method 1: Using the API Directly (Quickest)

### Step 1: Get your Stream ID
1. Go to http://localhost:3000/streams
2. Click on a stream (e.g., "Index Mapper Tools")
3. Check the URL - it will contain the stream ID

### Step 2: Create a work item using curl

```bash
# Replace YOUR_STREAM_ID with the actual ID
curl -X POST http://localhost:3000/api/work-items \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "streamId": "YOUR_STREAM_ID",
    "title": "Implement user authentication",
    "description": "Add OAuth2 login with Google and GitHub",
    "depth": "deep",
    "tags": ["backend", "security"]
  }'
```

### Step 3: Save your session cookie first
```bash
# Login and save cookies
curl -c cookies.txt http://localhost:3000/login
```

---

## Method 2: Using the Database Script (Easiest)

I've created a helper script for you:

```bash
cd app
npm run add-work-item
```

This will guide you through adding a work item interactively.

---

## Method 3: Direct Database Insert (For Bulk)

```typescript
// app/scripts/add-my-work-items.ts
import { db } from "../src/lib/db";
import { workItems, streams } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

async function addWorkItems() {
  // Get your stream
  const stream = await db.query.streams.findFirst({
    where: eq(streams.name, "Index Mapper Tools")
  });

  if (!stream) {
    console.error("Stream not found!");
    return;
  }

  // Add work items
  const items = [
    {
      streamId: stream.id,
      title: "Design API endpoints",
      description: "Design RESTful API for mapper service",
      energyState: "dormant" as const,
      depth: "medium" as const,
      streamPosition: 0.2,
    },
    {
      streamId: stream.id,
      title: "Implement core mapping logic",
      description: "Transform JSON to required format",
      energyState: "kindling" as const,
      energyLevel: 30,
      depth: "deep" as const,
      streamPosition: 0.5,
    },
    {
      streamId: stream.id,
      title: "Write unit tests",
      description: "Test coverage for mapper functions",
      energyState: "dormant" as const,
      depth: "shallow" as const,
      streamPosition: 0.3,
    },
  ];

  for (const item of items) {
    await db.insert(workItems).values(item);
  }

  // Update stream count
  await db.update(streams)
    .set({ 
      itemCount: stream.itemCount + items.length,
      updatedAt: new Date()
    })
    .where(eq(streams.id, stream.id));

  console.log(`✅ Added ${items.length} work items to ${stream.name}`);
}

addWorkItems();
```

Run it:
```bash
npx tsx --env-file=.env scripts/add-my-work-items.ts
```

---

## 📊 Work Item Energy States

When creating work items, use these energy states:

| State | Description | Energy Level |
|-------|-------------|--------------|
| `dormant` | Not started yet | 0 |
| `kindling` | Just started, warming up | 1-40 |
| `blazing` | Actively working, high energy | 41-90 |
| `cooling` | Almost done, wrapping up | 91-99 |
| `crystallized` | Completed! | 100 |

## 📏 Work Item Depth

| Depth | Description | Typical Time |
|-------|-------------|--------------|
| `shallow` | Quick task | < 2 hours |
| `medium` | Standard task | 2-8 hours |
| `deep` | Complex task | 1-3 days |
| `abyssal` | Major initiative | > 1 week |

---

## 🚀 Quick Example: Add 3 Work Items

```bash
cd /Users/wk/Source/dev-team/app

# Create a quick script
cat > add-real-work.ts << 'EOF'
import { db } from "./src/lib/db";
import { workItems, streams } from "./src/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  // Get "Index Mapper Tools" stream
  const stream = await db.query.streams.findFirst({
    where: eq(streams.name, "Index Mapper Tools")
  });

  if (!stream) throw new Error("Stream not found");

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
    await db.insert(workItems).values(item);
    console.log(`  ✓ Created: ${item.title}`);
  }

  await db.update(streams)
    .set({ 
      itemCount: stream.itemCount + items.length,
      crystalCount: stream.crystalCount + 1,
      updatedAt: new Date()
    })
    .where(eq(streams.id, stream.id));

  console.log(`\n✅ Added ${items.length} work items!`);
  console.log("   - 1 active (blazing)");
  console.log("   - 1 completed (crystal)");
  console.log("   - 1 not started (dormant)");
  
  process.exit(0);
}

main();
EOF

# Run it
npx tsx --env-file=.env add-real-work.ts

# Clean up
rm add-real-work.ts
```

After running this, refresh http://localhost:3000/streams and you'll see:
- ✅ **1 active** (the blazing item)
- ✅ **1 crystal** (the crystallized item)

---

## 🎨 Next Steps

1. **Add more work items** to your streams
2. **Update energy states** as you work (use PATCH `/api/work-items/[id]`)
3. **Dive into streams** in the Observatory to see work items in 3D
4. **Complete items** by updating them to `crystallized` state

---

## 💡 Pro Tips

- **Stream Position**: Use 0.0-1.0 to position items along the stream (0 = start, 1 = end)
- **Energy Level**: Gradually increase from 0 to 100 as work progresses
- **Tags**: Add tags like `["frontend", "urgent"]` for filtering
- **Contributors**: Assign `primaryDiverId` to show who's working on it

Enjoy tracking your **real work** in FlowState! 🚀
