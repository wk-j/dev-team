/**
 * Database Seed Script
 * 
 * Creates demo data for testing FlowState:
 * - 1 Team
 * - 6 Team Members (users)
 * - 4 Streams with different states
 * - 15 Work Items across streams
 * - Resonance connections between members
 * 
 * Run with: npm run db:seed
 */

import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../schema";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

// Demo team members with cosmic properties
const teamMembers = [
  {
    email: "alex@flowstate.dev",
    name: "Alex Chen",
    role: "Tech Lead",
    starType: "sun" as const,
    energySignatureColor: "#fbbf24",
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    orbitalState: "open" as const,
  },
  {
    email: "maya@flowstate.dev",
    name: "Maya Patel",
    role: "Senior Developer",
    starType: "giant" as const,
    energySignatureColor: "#f97316",
    positionX: 15,
    positionY: 5,
    positionZ: -10,
    orbitalState: "focused" as const,
  },
  {
    email: "jordan@flowstate.dev",
    name: "Jordan Kim",
    role: "Developer",
    starType: "main_sequence" as const,
    energySignatureColor: "#00d4ff",
    positionX: -12,
    positionY: -3,
    positionZ: 8,
    orbitalState: "deep_work" as const,
  },
  {
    email: "sam@flowstate.dev",
    name: "Sam Wilson",
    role: "Developer",
    starType: "main_sequence" as const,
    energySignatureColor: "#10b981",
    positionX: 8,
    positionY: -8,
    positionZ: 15,
    orbitalState: "open" as const,
  },
  {
    email: "riley@flowstate.dev",
    name: "Riley Brooks",
    role: "Junior Developer",
    starType: "dwarf" as const,
    energySignatureColor: "#ff6b9d",
    positionX: -18,
    positionY: 10,
    positionZ: -5,
    orbitalState: "away" as const,
  },
  {
    email: "nova@flowstate.dev",
    name: "Dr. Nova",
    role: "Specialist",
    starType: "neutron" as const,
    energySignatureColor: "#8b5cf6",
    positionX: 20,
    positionY: 2,
    positionZ: 12,
    orbitalState: "focused" as const,
  },
];

// Demo streams
const demoStreams = [
  {
    name: "Frontend Sprint",
    description: "Q4 UI overhaul and component library updates",
    state: "rushing" as const,
    velocity: 1.2,
    pathPoints: [
      { x: -30, y: 0, z: -20, t: 0 },
      { x: -15, y: 5, z: -15, t: 0.25 },
      { x: 0, y: 2, z: -10, t: 0.5 },
      { x: 15, y: -3, z: -5, t: 0.75 },
      { x: 30, y: 0, z: 0, t: 1 },
    ],
  },
  {
    name: "API Development",
    description: "RESTful API endpoints and GraphQL integration",
    state: "flowing" as const,
    velocity: 1.0,
    pathPoints: [
      { x: -25, y: -10, z: 10, t: 0 },
      { x: -10, y: -5, z: 15, t: 0.33 },
      { x: 5, y: 0, z: 20, t: 0.66 },
      { x: 20, y: 5, z: 15, t: 1 },
    ],
  },
  {
    name: "Bug Fixes",
    description: "Critical bugs and technical debt",
    state: "nascent" as const,
    velocity: 0.5,
    pathPoints: [
      { x: 0, y: 15, z: -15, t: 0 },
      { x: 10, y: 12, z: -5, t: 0.5 },
      { x: 20, y: 10, z: 5, t: 1 },
    ],
  },
  {
    name: "Infrastructure",
    description: "DevOps, CI/CD, and monitoring",
    state: "stagnant" as const,
    velocity: 0.3,
    pathPoints: [
      { x: -20, y: 8, z: 5, t: 0 },
      { x: -5, y: 10, z: 0, t: 0.5 },
      { x: 10, y: 6, z: -8, t: 1 },
    ],
  },
];

// Demo work items per stream
const workItemsData: Record<string, Array<{
  title: string;
  description: string;
  energyState: "dormant" | "kindling" | "blazing" | "cooling" | "crystallized";
  energyLevel: number;
  depth: "shallow" | "medium" | "deep" | "abyssal";
  streamPosition: number;
}>> = {
  "Frontend Sprint": [
    { title: "Implement dark mode toggle", description: "Add system-wide dark mode support with user preference persistence", energyState: "crystallized", energyLevel: 100, depth: "medium", streamPosition: 0.9 },
    { title: "Design system updates", description: "Update component library with new design tokens", energyState: "blazing", energyLevel: 78, depth: "deep", streamPosition: 0.6 },
    { title: "Dashboard performance optimization", description: "Reduce initial load time and improve FPS", energyState: "kindling", energyLevel: 35, depth: "deep", streamPosition: 0.4 },
    { title: "Mobile responsive fixes", description: "Fix layout issues on tablet and mobile devices", energyState: "dormant", energyLevel: 0, depth: "shallow", streamPosition: 0.2 },
  ],
  "API Development": [
    { title: "User authentication endpoints", description: "OAuth2 and JWT token management", energyState: "crystallized", energyLevel: 100, depth: "deep", streamPosition: 0.85 },
    { title: "Rate limiting middleware", description: "Implement API rate limiting with Redis", energyState: "cooling", energyLevel: 90, depth: "medium", streamPosition: 0.7 },
    { title: "WebSocket real-time updates", description: "Push notifications for team activity", energyState: "blazing", energyLevel: 65, depth: "abyssal", streamPosition: 0.5 },
    { title: "API documentation", description: "OpenAPI spec and interactive docs", energyState: "kindling", energyLevel: 20, depth: "shallow", streamPosition: 0.3 },
  ],
  "Bug Fixes": [
    { title: "Form validation edge cases", description: "Fix validation for special characters in names", energyState: "dormant", energyLevel: 0, depth: "shallow", streamPosition: 0.2 },
    { title: "Memory leak in canvas", description: "Three.js objects not being disposed properly", energyState: "kindling", energyLevel: 15, depth: "deep", streamPosition: 0.4 },
    { title: "Session timeout handling", description: "Graceful redirect on token expiry", energyState: "dormant", energyLevel: 0, depth: "medium", streamPosition: 0.6 },
  ],
  "Infrastructure": [
    { title: "CI/CD pipeline setup", description: "GitHub Actions for automated testing and deployment", energyState: "crystallized", energyLevel: 100, depth: "deep", streamPosition: 0.8 },
    { title: "Monitoring dashboard", description: "Grafana dashboards for system metrics", energyState: "dormant", energyLevel: 0, depth: "medium", streamPosition: 0.5 },
    { title: "Database backup automation", description: "Scheduled backups with retention policy", energyState: "dormant", energyLevel: 0, depth: "medium", streamPosition: 0.3 },
    { title: "Load testing framework", description: "k6 scripts for performance testing", energyState: "dormant", energyLevel: 0, depth: "shallow", streamPosition: 0.1 },
  ],
};

async function seed() {
  console.log("🌱 Starting database seed...\n");

  try {
    // 1. Create demo team
    console.log("📦 Creating team...");
    const [team] = await db.insert(schema.teams).values({
      name: "FlowState Core",
      description: "The core development team building FlowState",
      pulseRate: 72,
      totalCrystals: 0,
    }).returning();
    
    if (!team) {
      throw new Error("Failed to create team");
    }
    console.log(`   ✓ Created team: ${team.name} (${team.id})\n`);

    // 2. Create users with hashed passwords
    console.log("👥 Creating team members...");
    const passwordHash = await bcrypt.hash("demo123", 12);
    const createdUsers: Array<typeof schema.users.$inferSelect> = [];

    for (const member of teamMembers) {
      const [user] = await db.insert(schema.users).values({
        ...member,
        passwordHash,
        currentEnergyLevel: Math.floor(Math.random() * 40) + 60, // 60-100
        lastActiveAt: new Date(),
      }).returning();
      
      if (!user) {
        throw new Error(`Failed to create user: ${member.name}`);
      }
      createdUsers.push(user);
      console.log(`   ✓ Created user: ${user.name} (${user.starType})`);
    }
    console.log("");

    // 3. Create team memberships
    console.log("🔗 Creating team memberships...");
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i]!;
      await db.insert(schema.teamMemberships).values({
        userId: user.id,
        teamId: team.id,
        role: i === 0 ? "admin" : "member",
      });
    }
    console.log(`   ✓ Added ${createdUsers.length} members to team\n`);

    // 4. Create streams
    console.log("🌊 Creating streams...");
    const createdStreams: Array<typeof schema.streams.$inferSelect> = [];

    for (const streamData of demoStreams) {
      const [stream] = await db.insert(schema.streams).values({
        teamId: team.id,
        name: streamData.name,
        description: streamData.description,
        state: streamData.state,
        velocity: streamData.velocity,
        pathPoints: streamData.pathPoints,
        itemCount: 0,
        crystalCount: 0,
      }).returning();
      
      if (!stream) {
        throw new Error(`Failed to create stream: ${streamData.name}`);
      }
      createdStreams.push(stream);
      console.log(`   ✓ Created stream: ${stream.name} (${stream.state})`);
    }
    console.log("");

    // 5. Create work items
    console.log("⚡ Creating work items...");
    let totalWorkItems = 0;
    let totalCrystals = 0;

    for (const stream of createdStreams) {
      const items = workItemsData[stream.name] || [];
      let streamCrystals = 0;

      for (const itemData of items) {
        // Assign random primary diver for non-dormant items
        const primaryDiver = itemData.energyState !== "dormant" 
          ? createdUsers[Math.floor(Math.random() * createdUsers.length)]
          : null;

        const [workItem] = await db.insert(schema.workItems).values({
          streamId: stream.id,
          title: itemData.title,
          description: itemData.description,
          energyState: itemData.energyState,
          energyLevel: itemData.energyLevel,
          depth: itemData.depth,
          streamPosition: itemData.streamPosition,
          primaryDiverId: primaryDiver?.id,
          kindledAt: itemData.energyState !== "dormant" ? new Date() : null,
          crystallizedAt: itemData.energyState === "crystallized" ? new Date() : null,
          crystalFacets: itemData.energyState === "crystallized" ? Math.floor(Math.random() * 3) + 1 : null,
          crystalBrilliance: itemData.energyState === "crystallized" ? Math.floor(Math.random() * 50) + 50 : null,
        }).returning();

        if (!workItem) {
          throw new Error(`Failed to create work item: ${itemData.title}`);
        }

        // Add contributors for active items
        if (primaryDiver) {
          await db.insert(schema.workItemContributors).values({
            workItemId: workItem.id,
            userId: primaryDiver.id,
            isPrimary: true,
            energyContributed: itemData.energyLevel,
          });
        }

        if (itemData.energyState === "crystallized") {
          streamCrystals++;
          totalCrystals++;
        }
        totalWorkItems++;
      }

      // Update stream counts
      await db.update(schema.streams)
        .set({ 
          itemCount: items.length, 
          crystalCount: streamCrystals 
        })
        .where(eq(schema.streams.id, stream.id));

      console.log(`   ✓ Added ${items.length} work items to "${stream.name}"`);
    }
    console.log("");

    // Update team total crystals
    await db.update(schema.teams)
      .set({ totalCrystals })
      .where(eq(schema.teams.id, team.id));

    // 6. Create resonance connections between team members
    console.log("✨ Creating resonance connections...");
    const connections = [
      { a: 0, b: 1, score: 85 },  // Alex & Maya
      { a: 0, b: 2, score: 72 },  // Alex & Jordan
      { a: 1, b: 2, score: 68 },  // Maya & Jordan
      { a: 2, b: 3, score: 55 },  // Jordan & Sam
      { a: 3, b: 4, score: 40 },  // Sam & Riley
      { a: 0, b: 5, score: 90 },  // Alex & Dr. Nova
      { a: 1, b: 5, score: 75 },  // Maya & Dr. Nova
    ];

    for (const conn of connections) {
      const userA = createdUsers[conn.a]!;
      const userB = createdUsers[conn.b]!;
      
      await db.insert(schema.resonanceConnections).values({
        teamId: team.id,
        userIdA: userA.id,
        userIdB: userB.id,
        resonanceScore: conn.score,
        sharedWorkItems: Math.floor(Math.random() * 5) + 1,
        sharedStreams: Math.floor(Math.random() * 3) + 1,
        pingCount: Math.floor(Math.random() * 20),
      });
    }
    console.log(`   ✓ Created ${connections.length} resonance connections\n`);

    // 7. Add some active stream divers
    console.log("🏊 Adding active divers to streams...");
    const frontendStream = createdStreams.find(s => s.name === "Frontend Sprint")!;
    const apiStream = createdStreams.find(s => s.name === "API Development")!;

    // Maya and Jordan diving in Frontend Sprint
    await db.insert(schema.streamDivers).values([
      { streamId: frontendStream.id, userId: createdUsers[1]!.id },
      { streamId: frontendStream.id, userId: createdUsers[2]!.id },
    ]);

    // Alex and Dr. Nova diving in API Development
    await db.insert(schema.streamDivers).values([
      { streamId: apiStream.id, userId: createdUsers[0]!.id },
      { streamId: apiStream.id, userId: createdUsers[5]!.id },
    ]);

    console.log(`   ✓ Added divers to active streams\n`);

    // Summary
    console.log("═".repeat(50));
    console.log("🎉 Seed completed successfully!\n");
    console.log("Summary:");
    console.log(`   • 1 Team: "${team.name}"`);
    console.log(`   • ${createdUsers.length} Team Members`);
    console.log(`   • ${createdStreams.length} Streams`);
    console.log(`   • ${totalWorkItems} Work Items (${totalCrystals} crystallized)`);
    console.log(`   • ${connections.length} Resonance Connections`);
    console.log("");
    console.log("Demo login credentials:");
    console.log("   Email: alex@flowstate.dev");
    console.log("   Password: demo123");
    console.log("═".repeat(50));

  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run seed
seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
