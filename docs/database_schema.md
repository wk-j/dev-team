# FlowState Database Schema & Entity Classes

## Overview

FlowState uses PostgreSQL with Drizzle ORM for type-safe database operations. This document defines the complete database schema and corresponding TypeScript entity classes.

---

## Database Schema (Drizzle)

### src/lib/db/schema.ts

```typescript
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
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// ENUMS
// ============================================================================

export const starTypeEnum = pgEnum('star_type', [
  'sun',
  'giant',
  'main_sequence',
  'dwarf',
  'neutron',
]);

export const orbitalStateEnum = pgEnum('orbital_state', [
  'open',
  'deep_work',
  'recovery',
  'supernova',
  'eclipse',
]);

export const energyStateEnum = pgEnum('energy_state', [
  'dormant',
  'kindling',
  'blazing',
  'cooling',
  'crystallized',
]);

export const streamStateEnum = pgEnum('stream_state', [
  'rushing',
  'flowing',
  'stagnant',
  'frozen',
  'flooding',
  'evaporated',
]);

export const workItemDepthEnum = pgEnum('work_item_depth', [
  'shallow',
  'medium',
  'deep',
  'abyssal',
]);

export const pingTypeEnum = pgEnum('ping_type', [
  'gentle',
  'warm',
  'direct',
]);

export const pingStatusEnum = pgEnum('ping_status', [
  'sent',
  'delivered',
  'read',
  'expired',
]);

// ============================================================================
// USERS TABLE
// ============================================================================

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Identity
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  name: varchar('name', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url'),
  role: varchar('role', { length: 100 }),
  
  // Celestial Properties
  starType: starTypeEnum('star_type').notNull().default('main_sequence'),
  energySignatureColor: varchar('energy_signature_color', { length: 7 }).notNull().default('#00d4ff'),
  orbitalState: orbitalStateEnum('orbital_state').notNull().default('open'),
  
  // Position in void (3D coordinates)
  positionX: real('position_x').notNull().default(0),
  positionY: real('position_y').notNull().default(0),
  positionZ: real('position_z').notNull().default(0),
  
  // Current energy metrics
  currentEnergyLevel: integer('current_energy_level').notNull().default(100),
  
  // Settings
  sanctumTheme: varchar('sanctum_theme', { length: 50 }).default('deep_void'),
  preferences: jsonb('preferences').$type<UserPreferences>(),
  
  // OAuth
  oauthProvider: varchar('oauth_provider', { length: 50 }),
  oauthProviderId: varchar('oauth_provider_id', { length: 255 }),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
  
  // Soft delete
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
  orbitalStateIdx: index('users_orbital_state_idx').on(table.orbitalState),
  activeIdx: index('users_active_idx').on(table.lastActiveAt),
}));

// ============================================================================
// TEAMS TABLE
// ============================================================================

export const teams = pgTable('teams', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Constellation properties
  constellationLayout: jsonb('constellation_layout').$type<ConstellationLayout>(),
  
  // Aggregate metrics (cached)
  pulseRate: integer('pulse_rate').default(60), // BPM metaphor
  totalCrystals: integer('total_crystals').default(0),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// TEAM MEMBERSHIPS TABLE
// ============================================================================

export const teamMemberships = pgTable('team_memberships', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  
  role: varchar('role', { length: 50 }).notNull().default('member'), // 'owner', 'admin', 'member'
  
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userTeamIdx: uniqueIndex('team_memberships_user_team_idx').on(table.userId, table.teamId),
}));

// ============================================================================
// STREAMS TABLE
// ============================================================================

export const streams = pgTable('streams', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Stream state
  state: streamStateEnum('state').notNull().default('flowing'),
  velocity: real('velocity').notNull().default(1.0), // 0.0 - 2.0 multiplier
  
  // Visual path (array of 3D points)
  pathPoints: jsonb('path_points').$type<PathPoint[]>().notNull().default([]),
  
  // Metrics
  itemCount: integer('item_count').notNull().default(0),
  crystalCount: integer('crystal_count').notNull().default(0),
  
  // Parent stream for forks
  parentStreamId: uuid('parent_stream_id').references(() => streams.id),
  
  // Priority/ordering
  priority: integer('priority').notNull().default(0),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  evaporatedAt: timestamp('evaporated_at', { withTimezone: true }),
}, (table) => ({
  teamIdx: index('streams_team_idx').on(table.teamId),
  stateIdx: index('streams_state_idx').on(table.state),
}));

// ============================================================================
// STREAM DIVERS TABLE (Users currently diving in a stream)
// ============================================================================

export const streamDivers = pgTable('stream_divers', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  streamId: uuid('stream_id').notNull().references(() => streams.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  divedAt: timestamp('dived_at', { withTimezone: true }).notNull().defaultNow(),
  surfacedAt: timestamp('surfaced_at', { withTimezone: true }),
}, (table) => ({
  streamUserIdx: uniqueIndex('stream_divers_stream_user_idx').on(table.streamId, table.userId),
  activeIdx: index('stream_divers_active_idx').on(table.surfacedAt),
}));

// ============================================================================
// WORK ITEMS TABLE
// ============================================================================

export const workItems = pgTable('work_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  streamId: uuid('stream_id').notNull().references(() => streams.id, { onDelete: 'cascade' }),
  
  // Content
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  
  // Energy state
  energyState: energyStateEnum('energy_state').notNull().default('dormant'),
  energyLevel: integer('energy_level').notNull().default(0), // 0-100
  
  // Depth/complexity
  depth: workItemDepthEnum('depth').notNull().default('medium'),
  
  // Position in stream flow (0.0 - 1.0, where 1.0 is at delta/crystallization)
  streamPosition: real('stream_position').notNull().default(0),
  
  // Primary contributor
  primaryDiverId: uuid('primary_diver_id').references(() => users.id),
  
  // Metadata
  tags: jsonb('tags').$type<string[]>().default([]),
  metadata: jsonb('metadata').$type<WorkItemMetadata>(),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  kindledAt: timestamp('kindled_at', { withTimezone: true }),
  crystallizedAt: timestamp('crystallized_at', { withTimezone: true }),
  
  // For crystallized items
  crystalFacets: integer('crystal_facets').default(0), // Number of contributors
  crystalBrilliance: integer('crystal_brilliance').default(0), // Impact score 1-5
}, (table) => ({
  streamIdx: index('work_items_stream_idx').on(table.streamId),
  energyStateIdx: index('work_items_energy_state_idx').on(table.energyState),
  primaryDiverIdx: index('work_items_primary_diver_idx').on(table.primaryDiverId),
}));

// ============================================================================
// WORK ITEM CONTRIBUTORS TABLE
// ============================================================================

export const workItemContributors = pgTable('work_item_contributors', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  workItemId: uuid('work_item_id').notNull().references(() => workItems.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Contribution metrics
  energyContributed: integer('energy_contributed').notNull().default(0),
  isPrimary: boolean('is_primary').notNull().default(false),
  
  firstContributedAt: timestamp('first_contributed_at', { withTimezone: true }).notNull().defaultNow(),
  lastContributedAt: timestamp('last_contributed_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  workItemUserIdx: uniqueIndex('work_item_contributors_item_user_idx').on(table.workItemId, table.userId),
}));

// ============================================================================
// DISCOVERIES TABLE (Notes/blockers found during work)
// ============================================================================

export const discoveries = pgTable('discoveries', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  workItemId: uuid('work_item_id').notNull().references(() => workItems.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  type: varchar('type', { length: 50 }).notNull(), // 'blocker', 'insight', 'fork_idea'
  content: text('content').notNull(),
  
  // If this spawned a new work item
  spawnedWorkItemId: uuid('spawned_work_item_id').references(() => workItems.id),
  
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// RESONANCE CONNECTIONS TABLE
// ============================================================================

export const resonanceConnections = pgTable('resonance_connections', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  
  // The two connected users (always store lower UUID first for consistency)
  userIdA: uuid('user_id_a').notNull().references(() => users.id, { onDelete: 'cascade' }),
  userIdB: uuid('user_id_b').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Connection strength (0-100)
  resonanceScore: integer('resonance_score').notNull().default(0),
  
  // Metrics that contribute to score
  sharedWorkItems: integer('shared_work_items').notNull().default(0),
  sharedStreams: integer('shared_streams').notNull().default(0),
  pingCount: integer('ping_count').notNull().default(0),
  
  // Mentorship direction (null if peer, 'a_to_b' or 'b_to_a')
  mentorshipDirection: varchar('mentorship_direction', { length: 10 }),
  
  establishedAt: timestamp('established_at', { withTimezone: true }).notNull().defaultNow(),
  lastInteractionAt: timestamp('last_interaction_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  teamIdx: index('resonance_connections_team_idx').on(table.teamId),
  userPairIdx: uniqueIndex('resonance_connections_user_pair_idx').on(table.userIdA, table.userIdB),
}));

// ============================================================================
// RESONANCE PINGS TABLE
// ============================================================================

export const resonancePings = pgTable('resonance_pings', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  fromUserId: uuid('from_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  toUserId: uuid('to_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  type: pingTypeEnum('type').notNull(),
  status: pingStatusEnum('status').notNull().default('sent'),
  
  message: text('message'),
  
  // Related context
  relatedWorkItemId: uuid('related_work_item_id').references(() => workItems.id),
  relatedStreamId: uuid('related_stream_id').references(() => streams.id),
  
  sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  readAt: timestamp('read_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
}, (table) => ({
  toUserIdx: index('resonance_pings_to_user_idx').on(table.toUserId),
  statusIdx: index('resonance_pings_status_idx').on(table.status),
}));

// ============================================================================
// ENERGY EVENTS TABLE (Activity log)
// ============================================================================

export const energyEvents = pgTable('energy_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  
  eventType: varchar('event_type', { length: 100 }).notNull(),
  
  // Related entities
  workItemId: uuid('work_item_id').references(() => workItems.id),
  streamId: uuid('stream_id').references(() => streams.id),
  targetUserId: uuid('target_user_id').references(() => users.id),
  
  // Event data
  data: jsonb('data').$type<Record<string, unknown>>(),
  
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  teamIdx: index('energy_events_team_idx').on(table.teamId),
  occurredAtIdx: index('energy_events_occurred_at_idx').on(table.occurredAt),
  eventTypeIdx: index('energy_events_type_idx').on(table.eventType),
}));

// ============================================================================
// ORBITAL SCHEDULES TABLE
// ============================================================================

export const orbitalSchedules = pgTable('orbital_schedules', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Day of week (0-6, Sunday-Saturday)
  dayOfWeek: integer('day_of_week').notNull(),
  
  // Time range (stored as minutes from midnight)
  startMinutes: integer('start_minutes').notNull(),
  endMinutes: integer('end_minutes').notNull(),
  
  orbitalState: orbitalStateEnum('orbital_state').notNull(),
  
  isActive: boolean('is_active').notNull().default(true),
}, (table) => ({
  userIdx: index('orbital_schedules_user_idx').on(table.userId),
}));

// ============================================================================
// PORTALS (INTEGRATIONS) TABLE
// ============================================================================

export const portals = pgTable('portals', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  provider: varchar('provider', { length: 50 }).notNull(), // 'github', 'slack', 'calendar', etc.
  
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
  
  externalUserId: varchar('external_user_id', { length: 255 }),
  externalUsername: varchar('external_username', { length: 255 }),
  
  settings: jsonb('settings').$type<PortalSettings>(),
  
  connectedAt: timestamp('connected_at', { withTimezone: true }).notNull().defaultNow(),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
}, (table) => ({
  userProviderIdx: uniqueIndex('portals_user_provider_idx').on(table.userId, table.provider),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  teamMemberships: many(teamMemberships),
  primaryWorkItems: many(workItems),
  contributions: many(workItemContributors),
  sentPings: many(resonancePings, { relationName: 'sentPings' }),
  receivedPings: many(resonancePings, { relationName: 'receivedPings' }),
  streamDives: many(streamDivers),
  portals: many(portals),
  orbitalSchedules: many(orbitalSchedules),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  memberships: many(teamMemberships),
  streams: many(streams),
  resonanceConnections: many(resonanceConnections),
  energyEvents: many(energyEvents),
}));

export const teamMembershipsRelations = relations(teamMemberships, ({ one }) => ({
  user: one(users, {
    fields: [teamMemberships.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMemberships.teamId],
    references: [teams.id],
  }),
}));

export const streamsRelations = relations(streams, ({ one, many }) => ({
  team: one(teams, {
    fields: [streams.teamId],
    references: [teams.id],
  }),
  parentStream: one(streams, {
    fields: [streams.parentStreamId],
    references: [streams.id],
  }),
  workItems: many(workItems),
  divers: many(streamDivers),
}));

export const workItemsRelations = relations(workItems, ({ one, many }) => ({
  stream: one(streams, {
    fields: [workItems.streamId],
    references: [streams.id],
  }),
  primaryDiver: one(users, {
    fields: [workItems.primaryDiverId],
    references: [users.id],
  }),
  contributors: many(workItemContributors),
  discoveries: many(discoveries),
}));

export const resonancePingsRelations = relations(resonancePings, ({ one }) => ({
  fromUser: one(users, {
    fields: [resonancePings.fromUserId],
    references: [users.id],
    relationName: 'sentPings',
  }),
  toUser: one(users, {
    fields: [resonancePings.toUserId],
    references: [users.id],
    relationName: 'receivedPings',
  }),
  relatedWorkItem: one(workItems, {
    fields: [resonancePings.relatedWorkItemId],
    references: [workItems.id],
  }),
  relatedStream: one(streams, {
    fields: [resonancePings.relatedStreamId],
    references: [streams.id],
  }),
}));

// ============================================================================
// JSONB TYPE DEFINITIONS
// ============================================================================

export interface UserPreferences {
  dailyCheckInEnabled: boolean;
  weeklyReflectionEnabled: boolean;
  pingDelivery: {
    gentle: 'immediate' | 'batch_hourly' | 'batch_daily';
    warm: 'when_open' | 'always';
    direct: 'always';
  };
  visualPowers: {
    particleDensity: number; // 0-1
    glowIntensity: number; // 0-1
    animationSpeed: 'slow' | 'normal' | 'fast';
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
  t: number; // Parameter along curve (0-1)
}

export interface WorkItemMetadata {
  externalLinks?: string[];
  estimatedEnergy?: number;
  actualEnergy?: number;
  category?: string;
}

export interface PortalSettings {
  syncEnabled: boolean;
  webhookUrl?: string;
  mappings?: Record<string, string>;
}
```

---

## Entity Classes

### src/entities/base.entity.ts

```typescript
export abstract class BaseEntity {
  abstract readonly id: string;
  abstract readonly createdAt: Date;
  abstract readonly updatedAt: Date;

  /**
   * Check if this entity equals another by ID
   */
  equals(other: BaseEntity): boolean {
    if (!other) return false;
    return this.id === other.id;
  }

  /**
   * Get entity age in milliseconds
   */
  get age(): number {
    return Date.now() - this.createdAt.getTime();
  }

  /**
   * Check if entity was updated after creation
   */
  get wasModified(): boolean {
    return this.updatedAt.getTime() > this.createdAt.getTime();
  }
}
```

### src/entities/user.entity.ts

```typescript
import { BaseEntity } from './base.entity';

// ============================================================================
// ENUMS
// ============================================================================

export enum StarType {
  SUN = 'sun',
  GIANT = 'giant',
  MAIN_SEQUENCE = 'main_sequence',
  DWARF = 'dwarf',
  NEUTRON = 'neutron',
}

export enum OrbitalState {
  OPEN = 'open',
  DEEP_WORK = 'deep_work',
  RECOVERY = 'recovery',
  SUPERNOVA = 'supernova',
  ECLIPSE = 'eclipse',
}

// ============================================================================
// VALUE OBJECTS
// ============================================================================

export class Position3D {
  constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly z: number,
  ) {}

  distanceTo(other: Position3D): number {
    return Math.sqrt(
      Math.pow(this.x - other.x, 2) +
      Math.pow(this.y - other.y, 2) +
      Math.pow(this.z - other.z, 2)
    );
  }

  static origin(): Position3D {
    return new Position3D(0, 0, 0);
  }

  toArray(): [number, number, number] {
    return [this.x, this.y, this.z];
  }

  toObject(): { x: number; y: number; z: number } {
    return { x: this.x, y: this.y, z: this.z };
  }
}

export interface UserPreferences {
  dailyCheckInEnabled: boolean;
  weeklyReflectionEnabled: boolean;
  pingDelivery: {
    gentle: 'immediate' | 'batch_hourly' | 'batch_daily';
    warm: 'when_open' | 'always';
    direct: 'always';
  };
  visualPowers: {
    particleDensity: number;
    glowIntensity: number;
    animationSpeed: 'slow' | 'normal' | 'fast';
  };
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    classicView: boolean;
  };
}

// ============================================================================
// ENTITY CLASS
// ============================================================================

export class UserEntity extends BaseEntity {
  private constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly avatarUrl: string | null,
    public readonly role: string | null,
    public readonly starType: StarType,
    public readonly energySignatureColor: string,
    public readonly orbitalState: OrbitalState,
    public readonly position: Position3D,
    public readonly currentEnergyLevel: number,
    public readonly sanctumTheme: string,
    public readonly preferences: UserPreferences | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly lastActiveAt: Date | null,
  ) {
    super();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FACTORY METHODS
  // ─────────────────────────────────────────────────────────────────────────

  static create(props: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
    role?: string | null;
    starType?: StarType;
    energySignatureColor?: string;
    orbitalState?: OrbitalState;
    position?: Position3D;
    currentEnergyLevel?: number;
    sanctumTheme?: string;
    preferences?: UserPreferences | null;
    createdAt: Date;
    updatedAt: Date;
    lastActiveAt?: Date | null;
  }): UserEntity {
    return new UserEntity(
      props.id,
      props.email,
      props.name,
      props.avatarUrl ?? null,
      props.role ?? null,
      props.starType ?? StarType.MAIN_SEQUENCE,
      props.energySignatureColor ?? '#00d4ff',
      props.orbitalState ?? OrbitalState.OPEN,
      props.position ?? Position3D.origin(),
      props.currentEnergyLevel ?? 100,
      props.sanctumTheme ?? 'deep_void',
      props.preferences ?? null,
      props.createdAt,
      props.updatedAt,
      props.lastActiveAt ?? null,
    );
  }

  static fromDatabase(row: {
    id: string;
    email: string;
    name: string;
    avatar_url: string | null;
    role: string | null;
    star_type: string;
    energy_signature_color: string;
    orbital_state: string;
    position_x: number;
    position_y: number;
    position_z: number;
    current_energy_level: number;
    sanctum_theme: string | null;
    preferences: UserPreferences | null;
    created_at: Date;
    updated_at: Date;
    last_active_at: Date | null;
  }): UserEntity {
    return UserEntity.create({
      id: row.id,
      email: row.email,
      name: row.name,
      avatarUrl: row.avatar_url,
      role: row.role,
      starType: row.star_type as StarType,
      energySignatureColor: row.energy_signature_color,
      orbitalState: row.orbital_state as OrbitalState,
      position: new Position3D(row.position_x, row.position_y, row.position_z),
      currentEnergyLevel: row.current_energy_level,
      sanctumTheme: row.sanctum_theme ?? 'deep_void',
      preferences: row.preferences,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastActiveAt: row.last_active_at,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // COMPUTED PROPERTIES
  // ─────────────────────────────────────────────────────────────────────────

  get isAvailable(): boolean {
    return this.orbitalState === OrbitalState.OPEN;
  }

  get isInDeepWork(): boolean {
    return this.orbitalState === OrbitalState.DEEP_WORK;
  }

  get isAway(): boolean {
    return this.orbitalState === OrbitalState.ECLIPSE;
  }

  get isBlazing(): boolean {
    return this.orbitalState === OrbitalState.SUPERNOVA;
  }

  get energyPercentage(): number {
    return Math.min(100, Math.max(0, this.currentEnergyLevel));
  }

  get isLowEnergy(): boolean {
    return this.currentEnergyLevel < 30;
  }

  get displayInitials(): string {
    return this.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  get starSize(): number {
    const sizeMap: Record<StarType, number> = {
      [StarType.SUN]: 2.0,
      [StarType.GIANT]: 1.5,
      [StarType.MAIN_SEQUENCE]: 1.0,
      [StarType.DWARF]: 0.7,
      [StarType.NEUTRON]: 0.5,
    };
    return sizeMap[this.starType];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // METHODS
  // ─────────────────────────────────────────────────────────────────────────

  withOrbitalState(state: OrbitalState): UserEntity {
    return UserEntity.create({
      ...this.toCreateProps(),
      orbitalState: state,
      updatedAt: new Date(),
    });
  }

  withPosition(position: Position3D): UserEntity {
    return UserEntity.create({
      ...this.toCreateProps(),
      position,
      updatedAt: new Date(),
    });
  }

  withEnergyLevel(level: number): UserEntity {
    return UserEntity.create({
      ...this.toCreateProps(),
      currentEnergyLevel: Math.min(100, Math.max(0, level)),
      updatedAt: new Date(),
    });
  }

  canReceivePing(pingType: 'gentle' | 'warm' | 'direct'): boolean {
    if (pingType === 'direct') return true;
    if (this.isAway) return false;
    if (this.isInDeepWork && pingType !== 'direct') return false;
    return true;
  }

  private toCreateProps() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      avatarUrl: this.avatarUrl,
      role: this.role,
      starType: this.starType,
      energySignatureColor: this.energySignatureColor,
      orbitalState: this.orbitalState,
      position: this.position,
      currentEnergyLevel: this.currentEnergyLevel,
      sanctumTheme: this.sanctumTheme,
      preferences: this.preferences,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastActiveAt: this.lastActiveAt,
    };
  }
}
```

### src/entities/stream.entity.ts

```typescript
import { BaseEntity } from './base.entity';
import { Position3D } from './user.entity';

// ============================================================================
// ENUMS
// ============================================================================

export enum StreamState {
  RUSHING = 'rushing',
  FLOWING = 'flowing',
  STAGNANT = 'stagnant',
  FROZEN = 'frozen',
  FLOODING = 'flooding',
  EVAPORATED = 'evaporated',
}

// ============================================================================
// VALUE OBJECTS
// ============================================================================

export class PathPoint {
  constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly z: number,
    public readonly t: number, // Parameter along curve (0-1)
  ) {}

  toPosition3D(): Position3D {
    return new Position3D(this.x, this.y, this.z);
  }

  static fromObject(obj: { x: number; y: number; z: number; t: number }): PathPoint {
    return new PathPoint(obj.x, obj.y, obj.z, obj.t);
  }
}

export class StreamPath {
  constructor(public readonly points: PathPoint[]) {}

  get length(): number {
    return this.points.length;
  }

  get isEmpty(): boolean {
    return this.points.length === 0;
  }

  getPointAtParameter(t: number): Position3D | null {
    if (this.isEmpty) return null;
    
    // Simple linear interpolation for now
    const index = Math.floor(t * (this.points.length - 1));
    const point = this.points[Math.min(index, this.points.length - 1)];
    return point.toPosition3D();
  }

  static fromArray(arr: Array<{ x: number; y: number; z: number; t: number }>): StreamPath {
    return new StreamPath(arr.map(PathPoint.fromObject));
  }

  static createDefault(): StreamPath {
    return new StreamPath([
      new PathPoint(-10, 0, 0, 0),
      new PathPoint(-5, 2, 0, 0.25),
      new PathPoint(0, 0, 0, 0.5),
      new PathPoint(5, -2, 0, 0.75),
      new PathPoint(10, 0, 0, 1),
    ]);
  }
}

// ============================================================================
// ENTITY CLASS
// ============================================================================

export class StreamEntity extends BaseEntity {
  private constructor(
    public readonly id: string,
    public readonly teamId: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly state: StreamState,
    public readonly velocity: number,
    public readonly path: StreamPath,
    public readonly itemCount: number,
    public readonly crystalCount: number,
    public readonly parentStreamId: string | null,
    public readonly priority: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly evaporatedAt: Date | null,
  ) {
    super();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FACTORY METHODS
  // ─────────────────────────────────────────────────────────────────────────

  static create(props: {
    id: string;
    teamId: string;
    name: string;
    description?: string | null;
    state?: StreamState;
    velocity?: number;
    path?: StreamPath;
    itemCount?: number;
    crystalCount?: number;
    parentStreamId?: string | null;
    priority?: number;
    createdAt: Date;
    updatedAt: Date;
    evaporatedAt?: Date | null;
  }): StreamEntity {
    return new StreamEntity(
      props.id,
      props.teamId,
      props.name,
      props.description ?? null,
      props.state ?? StreamState.FLOWING,
      props.velocity ?? 1.0,
      props.path ?? StreamPath.createDefault(),
      props.itemCount ?? 0,
      props.crystalCount ?? 0,
      props.parentStreamId ?? null,
      props.priority ?? 0,
      props.createdAt,
      props.updatedAt,
      props.evaporatedAt ?? null,
    );
  }

  static fromDatabase(row: {
    id: string;
    team_id: string;
    name: string;
    description: string | null;
    state: string;
    velocity: number;
    path_points: Array<{ x: number; y: number; z: number; t: number }>;
    item_count: number;
    crystal_count: number;
    parent_stream_id: string | null;
    priority: number;
    created_at: Date;
    updated_at: Date;
    evaporated_at: Date | null;
  }): StreamEntity {
    return StreamEntity.create({
      id: row.id,
      teamId: row.team_id,
      name: row.name,
      description: row.description,
      state: row.state as StreamState,
      velocity: row.velocity,
      path: StreamPath.fromArray(row.path_points),
      itemCount: row.item_count,
      crystalCount: row.crystal_count,
      parentStreamId: row.parent_stream_id,
      priority: row.priority,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      evaporatedAt: row.evaporated_at,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // COMPUTED PROPERTIES
  // ─────────────────────────────────────────────────────────────────────────

  get isActive(): boolean {
    return ![StreamState.EVAPORATED, StreamState.FROZEN].includes(this.state);
  }

  get isHealthy(): boolean {
    return [StreamState.RUSHING, StreamState.FLOWING].includes(this.state);
  }

  get isStagnant(): boolean {
    return this.state === StreamState.STAGNANT;
  }

  get isFlooding(): boolean {
    return this.state === StreamState.FLOODING;
  }

  get isFork(): boolean {
    return this.parentStreamId !== null;
  }

  get completionRate(): number {
    const total = this.itemCount + this.crystalCount;
    if (total === 0) return 0;
    return this.crystalCount / total;
  }

  get velocityDescription(): string {
    if (this.velocity > 1.5) return 'rushing';
    if (this.velocity > 0.8) return 'steady';
    if (this.velocity > 0.3) return 'slow';
    return 'stagnant';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // METHODS
  // ─────────────────────────────────────────────────────────────────────────

  withState(state: StreamState): StreamEntity {
    return StreamEntity.create({
      ...this.toCreateProps(),
      state,
      updatedAt: new Date(),
    });
  }

  withVelocity(velocity: number): StreamEntity {
    return StreamEntity.create({
      ...this.toCreateProps(),
      velocity: Math.max(0, Math.min(2, velocity)),
      updatedAt: new Date(),
    });
  }

  incrementItemCount(): StreamEntity {
    return StreamEntity.create({
      ...this.toCreateProps(),
      itemCount: this.itemCount + 1,
      updatedAt: new Date(),
    });
  }

  crystallizeItem(): StreamEntity {
    return StreamEntity.create({
      ...this.toCreateProps(),
      itemCount: Math.max(0, this.itemCount - 1),
      crystalCount: this.crystalCount + 1,
      updatedAt: new Date(),
    });
  }

  evaporate(): StreamEntity {
    return StreamEntity.create({
      ...this.toCreateProps(),
      state: StreamState.EVAPORATED,
      evaporatedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  private toCreateProps() {
    return {
      id: this.id,
      teamId: this.teamId,
      name: this.name,
      description: this.description,
      state: this.state,
      velocity: this.velocity,
      path: this.path,
      itemCount: this.itemCount,
      crystalCount: this.crystalCount,
      parentStreamId: this.parentStreamId,
      priority: this.priority,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      evaporatedAt: this.evaporatedAt,
    };
  }
}
```

### src/entities/work-item.entity.ts

```typescript
import { BaseEntity } from './base.entity';

// ============================================================================
// ENUMS
// ============================================================================

export enum EnergyState {
  DORMANT = 'dormant',
  KINDLING = 'kindling',
  BLAZING = 'blazing',
  COOLING = 'cooling',
  CRYSTALLIZED = 'crystallized',
}

export enum WorkItemDepth {
  SHALLOW = 'shallow',
  MEDIUM = 'medium',
  DEEP = 'deep',
  ABYSSAL = 'abyssal',
}

// ============================================================================
// VALUE OBJECTS
// ============================================================================

export interface WorkItemMetadata {
  externalLinks?: string[];
  estimatedEnergy?: number;
  actualEnergy?: number;
  category?: string;
}

// ============================================================================
// ENTITY CLASS
// ============================================================================

export class WorkItemEntity extends BaseEntity {
  private constructor(
    public readonly id: string,
    public readonly streamId: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly energyState: EnergyState,
    public readonly energyLevel: number,
    public readonly depth: WorkItemDepth,
    public readonly streamPosition: number,
    public readonly primaryDiverId: string | null,
    public readonly tags: string[],
    public readonly metadata: WorkItemMetadata | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly kindledAt: Date | null,
    public readonly crystallizedAt: Date | null,
    public readonly crystalFacets: number,
    public readonly crystalBrilliance: number,
  ) {
    super();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FACTORY METHODS
  // ─────────────────────────────────────────────────────────────────────────

  static create(props: {
    id: string;
    streamId: string;
    title: string;
    description?: string | null;
    energyState?: EnergyState;
    energyLevel?: number;
    depth?: WorkItemDepth;
    streamPosition?: number;
    primaryDiverId?: string | null;
    tags?: string[];
    metadata?: WorkItemMetadata | null;
    createdAt: Date;
    updatedAt: Date;
    kindledAt?: Date | null;
    crystallizedAt?: Date | null;
    crystalFacets?: number;
    crystalBrilliance?: number;
  }): WorkItemEntity {
    return new WorkItemEntity(
      props.id,
      props.streamId,
      props.title,
      props.description ?? null,
      props.energyState ?? EnergyState.DORMANT,
      props.energyLevel ?? 0,
      props.depth ?? WorkItemDepth.MEDIUM,
      props.streamPosition ?? 0,
      props.primaryDiverId ?? null,
      props.tags ?? [],
      props.metadata ?? null,
      props.createdAt,
      props.updatedAt,
      props.kindledAt ?? null,
      props.crystallizedAt ?? null,
      props.crystalFacets ?? 0,
      props.crystalBrilliance ?? 0,
    );
  }

  static fromDatabase(row: {
    id: string;
    stream_id: string;
    title: string;
    description: string | null;
    energy_state: string;
    energy_level: number;
    depth: string;
    stream_position: number;
    primary_diver_id: string | null;
    tags: string[];
    metadata: WorkItemMetadata | null;
    created_at: Date;
    updated_at: Date;
    kindled_at: Date | null;
    crystallized_at: Date | null;
    crystal_facets: number;
    crystal_brilliance: number;
  }): WorkItemEntity {
    return WorkItemEntity.create({
      id: row.id,
      streamId: row.stream_id,
      title: row.title,
      description: row.description,
      energyState: row.energy_state as EnergyState,
      energyLevel: row.energy_level,
      depth: row.depth as WorkItemDepth,
      streamPosition: row.stream_position,
      primaryDiverId: row.primary_diver_id,
      tags: row.tags,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      kindledAt: row.kindled_at,
      crystallizedAt: row.crystallized_at,
      crystalFacets: row.crystal_facets,
      crystalBrilliance: row.crystal_brilliance,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // COMPUTED PROPERTIES
  // ─────────────────────────────────────────────────────────────────────────

  get isDormant(): boolean {
    return this.energyState === EnergyState.DORMANT;
  }

  get isActive(): boolean {
    return [EnergyState.KINDLING, EnergyState.BLAZING].includes(this.energyState);
  }

  get isCrystallized(): boolean {
    return this.energyState === EnergyState.CRYSTALLIZED;
  }

  get hasOwner(): boolean {
    return this.primaryDiverId !== null;
  }

  get energyPercentage(): number {
    return Math.min(100, Math.max(0, this.energyLevel));
  }

  get depthMultiplier(): number {
    const multipliers: Record<WorkItemDepth, number> = {
      [WorkItemDepth.SHALLOW]: 0.5,
      [WorkItemDepth.MEDIUM]: 1.0,
      [WorkItemDepth.DEEP]: 2.0,
      [WorkItemDepth.ABYSSAL]: 4.0,
    };
    return multipliers[this.depth];
  }

  get timeInCurrentState(): number {
    return Date.now() - this.updatedAt.getTime();
  }

  get timeToKindle(): number | null {
    if (!this.kindledAt) return null;
    return this.kindledAt.getTime() - this.createdAt.getTime();
  }

  get timeToCrystallize(): number | null {
    if (!this.crystallizedAt || !this.kindledAt) return null;
    return this.crystallizedAt.getTime() - this.kindledAt.getTime();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STATE TRANSITION METHODS
  // ─────────────────────────────────────────────────────────────────────────

  kindle(diverId: string): WorkItemEntity {
    if (this.energyState !== EnergyState.DORMANT) {
      throw new Error('Can only kindle dormant items');
    }
    
    return WorkItemEntity.create({
      ...this.toCreateProps(),
      energyState: EnergyState.KINDLING,
      energyLevel: 10,
      primaryDiverId: diverId,
      kindledAt: new Date(),
      updatedAt: new Date(),
    });
  }

  blaze(): WorkItemEntity {
    if (this.energyState !== EnergyState.KINDLING) {
      throw new Error('Can only blaze kindling items');
    }
    
    return WorkItemEntity.create({
      ...this.toCreateProps(),
      energyState: EnergyState.BLAZING,
      energyLevel: 80,
      updatedAt: new Date(),
    });
  }

  cool(): WorkItemEntity {
    if (this.energyState !== EnergyState.BLAZING) {
      throw new Error('Can only cool blazing items');
    }
    
    return WorkItemEntity.create({
      ...this.toCreateProps(),
      energyState: EnergyState.COOLING,
      energyLevel: 60,
      updatedAt: new Date(),
    });
  }

  crystallize(facets: number, brilliance: number): WorkItemEntity {
    if (this.energyState !== EnergyState.COOLING) {
      throw new Error('Can only crystallize cooling items');
    }
    
    return WorkItemEntity.create({
      ...this.toCreateProps(),
      energyState: EnergyState.CRYSTALLIZED,
      energyLevel: 100,
      streamPosition: 1.0, // At the delta
      crystallizedAt: new Date(),
      crystalFacets: facets,
      crystalBrilliance: Math.min(5, Math.max(1, brilliance)),
      updatedAt: new Date(),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // OTHER METHODS
  // ─────────────────────────────────────────────────────────────────────────

  addEnergy(amount: number): WorkItemEntity {
    const newLevel = Math.min(100, this.energyLevel + amount);
    
    // Auto-transition based on energy level
    let newState = this.energyState;
    if (this.energyState === EnergyState.KINDLING && newLevel >= 70) {
      newState = EnergyState.BLAZING;
    }
    
    return WorkItemEntity.create({
      ...this.toCreateProps(),
      energyState: newState,
      energyLevel: newLevel,
      updatedAt: new Date(),
    });
  }

  advancePosition(amount: number): WorkItemEntity {
    return WorkItemEntity.create({
      ...this.toCreateProps(),
      streamPosition: Math.min(1, this.streamPosition + amount),
      updatedAt: new Date(),
    });
  }

  assignTo(diverId: string): WorkItemEntity {
    return WorkItemEntity.create({
      ...this.toCreateProps(),
      primaryDiverId: diverId,
      updatedAt: new Date(),
    });
  }

  private toCreateProps() {
    return {
      id: this.id,
      streamId: this.streamId,
      title: this.title,
      description: this.description,
      energyState: this.energyState,
      energyLevel: this.energyLevel,
      depth: this.depth,
      streamPosition: this.streamPosition,
      primaryDiverId: this.primaryDiverId,
      tags: this.tags,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      kindledAt: this.kindledAt,
      crystallizedAt: this.crystallizedAt,
      crystalFacets: this.crystalFacets,
      crystalBrilliance: this.crystalBrilliance,
    };
  }
}
```

### src/entities/resonance-ping.entity.ts

```typescript
import { BaseEntity } from './base.entity';

// ============================================================================
// ENUMS
// ============================================================================

export enum PingType {
  GENTLE = 'gentle',
  WARM = 'warm',
  DIRECT = 'direct',
}

export enum PingStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  EXPIRED = 'expired',
}

// ============================================================================
// ENTITY CLASS
// ============================================================================

export class ResonancePingEntity extends BaseEntity {
  private constructor(
    public readonly id: string,
    public readonly fromUserId: string,
    public readonly toUserId: string,
    public readonly type: PingType,
    public readonly status: PingStatus,
    public readonly message: string | null,
    public readonly relatedWorkItemId: string | null,
    public readonly relatedStreamId: string | null,
    public readonly sentAt: Date,
    public readonly deliveredAt: Date | null,
    public readonly readAt: Date | null,
    public readonly expiresAt: Date | null,
  ) {
    super();
  }

  get createdAt(): Date {
    return this.sentAt;
  }

  get updatedAt(): Date {
    return this.readAt ?? this.deliveredAt ?? this.sentAt;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FACTORY METHODS
  // ─────────────────────────────────────────────────────────────────────────

  static create(props: {
    id: string;
    fromUserId: string;
    toUserId: string;
    type: PingType;
    status?: PingStatus;
    message?: string | null;
    relatedWorkItemId?: string | null;
    relatedStreamId?: string | null;
    sentAt?: Date;
    deliveredAt?: Date | null;
    readAt?: Date | null;
    expiresAt?: Date | null;
  }): ResonancePingEntity {
    const sentAt = props.sentAt ?? new Date();
    
    // Default expiry based on type
    let expiresAt = props.expiresAt;
    if (!expiresAt) {
      const expiryHours: Record<PingType, number> = {
        [PingType.GENTLE]: 72,
        [PingType.WARM]: 24,
        [PingType.DIRECT]: 4,
      };
      expiresAt = new Date(sentAt.getTime() + expiryHours[props.type] * 60 * 60 * 1000);
    }
    
    return new ResonancePingEntity(
      props.id,
      props.fromUserId,
      props.toUserId,
      props.type,
      props.status ?? PingStatus.SENT,
      props.message ?? null,
      props.relatedWorkItemId ?? null,
      props.relatedStreamId ?? null,
      sentAt,
      props.deliveredAt ?? null,
      props.readAt ?? null,
      expiresAt,
    );
  }

  static fromDatabase(row: {
    id: string;
    from_user_id: string;
    to_user_id: string;
    type: string;
    status: string;
    message: string | null;
    related_work_item_id: string | null;
    related_stream_id: string | null;
    sent_at: Date;
    delivered_at: Date | null;
    read_at: Date | null;
    expires_at: Date | null;
  }): ResonancePingEntity {
    return ResonancePingEntity.create({
      id: row.id,
      fromUserId: row.from_user_id,
      toUserId: row.to_user_id,
      type: row.type as PingType,
      status: row.status as PingStatus,
      message: row.message,
      relatedWorkItemId: row.related_work_item_id,
      relatedStreamId: row.related_stream_id,
      sentAt: row.sent_at,
      deliveredAt: row.delivered_at,
      readAt: row.read_at,
      expiresAt: row.expires_at,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // COMPUTED PROPERTIES
  // ─────────────────────────────────────────────────────────────────────────

  get isPending(): boolean {
    return this.status === PingStatus.SENT;
  }

  get isDelivered(): boolean {
    return this.status === PingStatus.DELIVERED || this.status === PingStatus.READ;
  }

  get isRead(): boolean {
    return this.status === PingStatus.READ;
  }

  get isExpired(): boolean {
    if (this.status === PingStatus.EXPIRED) return true;
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  get hasContext(): boolean {
    return this.relatedWorkItemId !== null || this.relatedStreamId !== null;
  }

  get urgencyLevel(): number {
    const levels: Record<PingType, number> = {
      [PingType.GENTLE]: 1,
      [PingType.WARM]: 2,
      [PingType.DIRECT]: 3,
    };
    return levels[this.type];
  }

  get timeToExpiry(): number | null {
    if (!this.expiresAt) return null;
    return Math.max(0, this.expiresAt.getTime() - Date.now());
  }

  // ─────────────────────────────────────────────────────────────────────────
  // METHODS
  // ─────────────────────────────────────────────────────────────────────────

  markDelivered(): ResonancePingEntity {
    if (this.isExpired) {
      throw new Error('Cannot deliver expired ping');
    }
    
    return new ResonancePingEntity(
      this.id,
      this.fromUserId,
      this.toUserId,
      this.type,
      PingStatus.DELIVERED,
      this.message,
      this.relatedWorkItemId,
      this.relatedStreamId,
      this.sentAt,
      new Date(),
      this.readAt,
      this.expiresAt,
    );
  }

  markRead(): ResonancePingEntity {
    return new ResonancePingEntity(
      this.id,
      this.fromUserId,
      this.toUserId,
      this.type,
      PingStatus.READ,
      this.message,
      this.relatedWorkItemId,
      this.relatedStreamId,
      this.sentAt,
      this.deliveredAt ?? new Date(),
      new Date(),
      this.expiresAt,
    );
  }

  expire(): ResonancePingEntity {
    return new ResonancePingEntity(
      this.id,
      this.fromUserId,
      this.toUserId,
      this.type,
      PingStatus.EXPIRED,
      this.message,
      this.relatedWorkItemId,
      this.relatedStreamId,
      this.sentAt,
      this.deliveredAt,
      this.readAt,
      this.expiresAt,
    );
  }
}
```

### src/entities/index.ts

```typescript
// Base
export { BaseEntity } from './base.entity';

// User
export {
  UserEntity,
  StarType,
  OrbitalState,
  Position3D,
  type UserPreferences,
} from './user.entity';

// Stream
export {
  StreamEntity,
  StreamState,
  PathPoint,
  StreamPath,
} from './stream.entity';

// Work Item
export {
  WorkItemEntity,
  EnergyState,
  WorkItemDepth,
  type WorkItemMetadata,
} from './work-item.entity';

// Resonance Ping
export {
  ResonancePingEntity,
  PingType,
  PingStatus,
} from './resonance-ping.entity';
```

---

## Database Connection

### src/lib/db/index.ts

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// For serverless environments (Vercel), use connection pooling
const connectionString = process.env.DATABASE_URL!;

// Disable prefetch for serverless
const client = postgres(connectionString, { 
  prepare: false,
  max: 10,
});

export const db = drizzle(client, { schema });

export type Database = typeof db;
```

---

## Migrations

Run the following commands to manage your database:

```bash
# Generate migration from schema changes
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Push schema directly (development only)
npm run db:push

# Open Drizzle Studio to browse data
npm run db:studio
```
