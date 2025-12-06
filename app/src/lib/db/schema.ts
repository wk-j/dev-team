import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  real,
  pgEnum,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ============================================================================
// ENUMS
// ============================================================================

export const starTypeEnum = pgEnum("star_type", [
  "sun",
  "giant",
  "main_sequence",
  "dwarf",
  "neutron",
]);

export const orbitalStateEnum = pgEnum("orbital_state", [
  "open",
  "focused",
  "deep_work",
  "away",
  "supernova",
]);

export const energyStateEnum = pgEnum("energy_state", [
  "dormant",
  "kindling",
  "blazing",
  "cooling",
  "crystallized",
]);

export const streamStateEnum = pgEnum("stream_state", [
  "nascent",
  "flowing",
  "rushing",
  "flooding",
  "stagnant",
  "evaporated",
]);

export const workItemDepthEnum = pgEnum("work_item_depth", [
  "shallow",
  "medium",
  "deep",
  "abyssal",
]);

export const pingTypeEnum = pgEnum("ping_type", ["gentle", "warm", "direct"]);

export const pingStatusEnum = pgEnum("ping_status", [
  "sent",
  "delivered",
  "read",
  "expired",
]);

// ============================================================================
// USERS TABLE
// ============================================================================

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Identity
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }),
    name: varchar("name", { length: 255 }).notNull(),
    avatarUrl: text("avatar_url"),
    role: varchar("role", { length: 100 }),

    // Celestial Properties
    starType: starTypeEnum("star_type").notNull().default("main_sequence"),
    energySignatureColor: varchar("energy_signature_color", { length: 7 })
      .notNull()
      .default("#00d4ff"),
    orbitalState: orbitalStateEnum("orbital_state").notNull().default("open"),

    // Position in void (3D coordinates)
    positionX: real("position_x").notNull().default(0),
    positionY: real("position_y").notNull().default(0),
    positionZ: real("position_z").notNull().default(0),

    // Current energy metrics
    currentEnergyLevel: integer("current_energy_level").notNull().default(100),

    // Settings
    sanctumTheme: varchar("sanctum_theme", { length: 50 }).default("deep_void"),
    preferences: jsonb("preferences").$type<UserPreferences>(),

    // OAuth
    oauthProvider: varchar("oauth_provider", { length: 50 }),
    oauthProviderId: varchar("oauth_provider_id", { length: 255 }),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }),

    // Soft delete
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
    index("users_orbital_state_idx").on(table.orbitalState),
    index("users_active_idx").on(table.lastActiveAt),
  ]
);

// ============================================================================
// TEAMS TABLE
// ============================================================================

export const teams = pgTable("teams", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),

  // Constellation properties
  constellationLayout: jsonb("constellation_layout").$type<ConstellationLayout>(),

  // Aggregate metrics (cached)
  pulseRate: integer("pulse_rate").default(60),
  totalCrystals: integer("total_crystals").default(0),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================================================
// TEAM MEMBERSHIPS TABLE
// ============================================================================

export const teamMemberships = pgTable(
  "team_memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),

    role: varchar("role", { length: 50 }).notNull().default("member"),

    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("team_memberships_user_team_idx").on(table.userId, table.teamId),
  ]
);

// ============================================================================
// STREAMS TABLE
// ============================================================================

export const streams = pgTable(
  "streams",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),

    // Stream state
    state: streamStateEnum("state").notNull().default("flowing"),
    velocity: real("velocity").notNull().default(1.0),

    // Visual path (array of 3D points)
    pathPoints: jsonb("path_points").$type<PathPoint[]>().notNull().default([]),

    // Metrics
    itemCount: integer("item_count").notNull().default(0),
    crystalCount: integer("crystal_count").notNull().default(0),

    // Parent stream for forks
    parentStreamId: uuid("parent_stream_id"),

    // Priority/ordering
    priority: integer("priority").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    evaporatedAt: timestamp("evaporated_at", { withTimezone: true }),
  },
  (table) => [
    index("streams_team_idx").on(table.teamId),
    index("streams_state_idx").on(table.state),
  ]
);

// ============================================================================
// STREAM DIVERS TABLE
// ============================================================================

export const streamDivers = pgTable(
  "stream_divers",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    streamId: uuid("stream_id")
      .notNull()
      .references(() => streams.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    divedAt: timestamp("dived_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    surfacedAt: timestamp("surfaced_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("stream_divers_stream_user_idx").on(table.streamId, table.userId),
    index("stream_divers_active_idx").on(table.surfacedAt),
  ]
);

// ============================================================================
// WORK ITEMS TABLE
// ============================================================================

export const workItems = pgTable(
  "work_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    streamId: uuid("stream_id")
      .notNull()
      .references(() => streams.id, { onDelete: "cascade" }),

    // Content
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),

    // Energy state
    energyState: energyStateEnum("energy_state").notNull().default("dormant"),
    energyLevel: integer("energy_level").notNull().default(0),

    // Depth/complexity
    depth: workItemDepthEnum("depth").notNull().default("medium"),

    // Position in stream flow (0.0 - 1.0)
    streamPosition: real("stream_position").notNull().default(0),

    // Primary contributor
    primaryDiverId: uuid("primary_diver_id").references(() => users.id),

    // Metadata
    tags: jsonb("tags").$type<string[]>().default([]),
    metadata: jsonb("metadata").$type<WorkItemMetadata>(),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    kindledAt: timestamp("kindled_at", { withTimezone: true }),
    crystallizedAt: timestamp("crystallized_at", { withTimezone: true }),

    // For crystallized items
    crystalFacets: integer("crystal_facets").default(0),
    crystalBrilliance: integer("crystal_brilliance").default(0),
  },
  (table) => [
    index("work_items_stream_idx").on(table.streamId),
    index("work_items_energy_state_idx").on(table.energyState),
    index("work_items_primary_diver_idx").on(table.primaryDiverId),
  ]
);

// ============================================================================
// WORK ITEM CONTRIBUTORS TABLE
// ============================================================================

export const workItemContributors = pgTable(
  "work_item_contributors",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    workItemId: uuid("work_item_id")
      .notNull()
      .references(() => workItems.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Contribution metrics
    energyContributed: integer("energy_contributed").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),

    firstContributedAt: timestamp("first_contributed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastContributedAt: timestamp("last_contributed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("work_item_contributors_item_user_idx").on(
      table.workItemId,
      table.userId
    ),
  ]
);

// ============================================================================
// RESONANCE CONNECTIONS TABLE
// ============================================================================

export const resonanceConnections = pgTable(
  "resonance_connections",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),

    // The two connected users
    userIdA: uuid("user_id_a")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userIdB: uuid("user_id_b")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Connection strength (0-100)
    resonanceScore: integer("resonance_score").notNull().default(0),

    // Metrics
    sharedWorkItems: integer("shared_work_items").notNull().default(0),
    sharedStreams: integer("shared_streams").notNull().default(0),
    pingCount: integer("ping_count").notNull().default(0),

    establishedAt: timestamp("established_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastInteractionAt: timestamp("last_interaction_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("resonance_connections_team_idx").on(table.teamId),
    uniqueIndex("resonance_connections_user_pair_idx").on(
      table.userIdA,
      table.userIdB
    ),
  ]
);

// ============================================================================
// RESONANCE PINGS TABLE
// ============================================================================

export const resonancePings = pgTable(
  "resonance_pings",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    fromUserId: uuid("from_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    toUserId: uuid("to_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    type: pingTypeEnum("type").notNull(),
    status: pingStatusEnum("status").notNull().default("sent"),

    message: text("message"),

    // Related context
    relatedWorkItemId: uuid("related_work_item_id").references(
      () => workItems.id
    ),
    relatedStreamId: uuid("related_stream_id").references(() => streams.id),

    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    readAt: timestamp("read_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (table) => [
    index("resonance_pings_to_user_idx").on(table.toUserId),
    index("resonance_pings_status_idx").on(table.status),
  ]
);

// ============================================================================
// ENERGY EVENTS TABLE
// ============================================================================

export const energyEvents = pgTable(
  "energy_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),

    eventType: varchar("event_type", { length: 100 }).notNull(),

    // Related entities
    workItemId: uuid("work_item_id").references(() => workItems.id),
    streamId: uuid("stream_id").references(() => streams.id),
    targetUserId: uuid("target_user_id").references(() => users.id),

    // Event data
    data: jsonb("data").$type<Record<string, unknown>>(),

    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("energy_events_team_idx").on(table.teamId),
    index("energy_events_occurred_at_idx").on(table.occurredAt),
    index("energy_events_type_idx").on(table.eventType),
  ]
);

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface UserPreferences {
  dailyCheckInEnabled: boolean;
  weeklyReflectionEnabled: boolean;
  pingDelivery: {
    gentle: "immediate" | "batch_hourly" | "batch_daily";
    warm: "when_open" | "always";
    direct: "always";
  };
  visualPowers: {
    particleDensity: number;
    glowIntensity: number;
    animationSpeed: "slow" | "normal" | "fast";
  };
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    classicView: boolean;
  };
}

export interface ConstellationLayout {
  positions: Record<string, { x: number; y: number; z: number }>;
  lastUpdatedAt: string;
}

export interface PathPoint {
  x: number;
  y: number;
  z: number;
  t: number;
}

export interface WorkItemMetadata {
  externalLinks?: string[];
  estimatedEnergy?: number;
  actualEnergy?: number;
  category?: string;
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type Stream = typeof streams.$inferSelect;
export type NewStream = typeof streams.$inferInsert;
export type WorkItem = typeof workItems.$inferSelect;
export type NewWorkItem = typeof workItems.$inferInsert;
export type ResonancePing = typeof resonancePings.$inferSelect;
export type NewResonancePing = typeof resonancePings.$inferInsert;

export type StarType = (typeof starTypeEnum.enumValues)[number];
export type OrbitalState = (typeof orbitalStateEnum.enumValues)[number];
export type EnergyState = (typeof energyStateEnum.enumValues)[number];
export type StreamState = (typeof streamStateEnum.enumValues)[number];
export type WorkItemDepth = (typeof workItemDepthEnum.enumValues)[number];
export type PingType = (typeof pingTypeEnum.enumValues)[number];
export type PingStatus = (typeof pingStatusEnum.enumValues)[number];
