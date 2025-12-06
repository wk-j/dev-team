# FlowState Architecture Layers

## Overview

FlowState follows a clean layered architecture pattern separating concerns across distinct layers:

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                          │
│  React Components, 3D Canvas, UI Elements                       │
├─────────────────────────────────────────────────────────────────┤
│                        API LAYER                                │
│  Next.js API Routes, Server Actions                             │
├─────────────────────────────────────────────────────────────────┤
│                      SERVICE LAYER                              │
│  Business Logic, Validation, Orchestration                      │
├─────────────────────────────────────────────────────────────────┤
│                    REPOSITORY LAYER                             │
│  Data Access, Query Building, Entity Mapping                    │
├─────────────────────────────────────────────────────────────────┤
│                       DATA LAYER                                │
│  Drizzle ORM, PostgreSQL, Redis                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Repository Layer

Repositories encapsulate all data access logic and return strongly-typed entity classes.

### Base Repository

```typescript
// src/repositories/base.repository.ts
import { db, Database } from '@/lib/db';
import { SQL, eq, and, or, desc, asc, sql } from 'drizzle-orm';
import { PgTableWithColumns } from 'drizzle-orm/pg-core';

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export abstract class BaseRepository<TTable extends PgTableWithColumns<any>, TEntity> {
  constructor(
    protected readonly db: Database,
    protected readonly table: TTable,
  ) {}

  /**
   * Convert database row to entity
   */
  protected abstract toEntity(row: any): TEntity;

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<TEntity | null> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.id, id))
      .limit(1);
    
    return result[0] ? this.toEntity(result[0]) : null;
  }

  /**
   * Find all entities matching conditions
   */
  async findMany(options?: {
    where?: SQL;
    orderBy?: SQL;
    limit?: number;
    offset?: number;
  }): Promise<TEntity[]> {
    let query = this.db.select().from(this.table);
    
    if (options?.where) {
      query = query.where(options.where) as any;
    }
    if (options?.orderBy) {
      query = query.orderBy(options.orderBy) as any;
    }
    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }
    if (options?.offset) {
      query = query.offset(options.offset) as any;
    }
    
    const results = await query;
    return results.map(row => this.toEntity(row));
  }

  /**
   * Find with pagination
   */
  async findPaginated(
    pagination: PaginationOptions,
    options?: { where?: SQL; orderBy?: SQL },
  ): Promise<PaginatedResult<TEntity>> {
    const { page, pageSize } = pagination;
    const offset = (page - 1) * pageSize;

    // Get total count
    let countQuery = this.db.select({ count: sql<number>`count(*)` }).from(this.table);
    if (options?.where) {
      countQuery = countQuery.where(options.where) as any;
    }
    const [{ count }] = await countQuery;
    const total = Number(count);

    // Get paginated data
    const data = await this.findMany({
      where: options?.where,
      orderBy: options?.orderBy,
      limit: pageSize,
      offset,
    });

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Check if entity exists
   */
  async exists(id: string): Promise<boolean> {
    const result = await this.db
      .select({ id: this.table.id })
      .from(this.table)
      .where(eq(this.table.id, id))
      .limit(1);
    
    return result.length > 0;
  }

  /**
   * Count entities matching condition
   */
  async count(where?: SQL): Promise<number> {
    let query = this.db.select({ count: sql<number>`count(*)` }).from(this.table);
    if (where) {
      query = query.where(where) as any;
    }
    const [{ count }] = await query;
    return Number(count);
  }

  /**
   * Delete entity by ID
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(this.table)
      .where(eq(this.table.id, id))
      .returning({ id: this.table.id });
    
    return result.length > 0;
  }
}
```

### User Repository

```typescript
// src/repositories/user.repository.ts
import { db } from '@/lib/db';
import { users, teamMemberships, resonanceConnections } from '@/lib/db/schema';
import { eq, and, or, desc, sql, inArray } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import { UserEntity, Position3D, OrbitalState, StarType } from '@/entities';

export class UserRepository extends BaseRepository<typeof users, UserEntity> {
  constructor() {
    super(db, users);
  }

  protected toEntity(row: any): UserEntity {
    return UserEntity.fromDatabase(row);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    
    return result[0] ? this.toEntity(result[0]) : null;
  }

  /**
   * Find all users in a team
   */
  async findByTeamId(teamId: string): Promise<UserEntity[]> {
    const result = await this.db
      .select({
        user: users,
      })
      .from(users)
      .innerJoin(teamMemberships, eq(users.id, teamMemberships.userId))
      .where(eq(teamMemberships.teamId, teamId));
    
    return result.map(r => this.toEntity(r.user));
  }

  /**
   * Create new user
   */
  async create(data: {
    email: string;
    name: string;
    passwordHash?: string;
    avatarUrl?: string;
    role?: string;
    starType?: StarType;
    energySignatureColor?: string;
  }): Promise<UserEntity> {
    const [result] = await this.db
      .insert(users)
      .values({
        email: data.email.toLowerCase(),
        name: data.name,
        passwordHash: data.passwordHash,
        avatarUrl: data.avatarUrl,
        role: data.role,
        starType: data.starType ?? 'main_sequence',
        energySignatureColor: data.energySignatureColor ?? '#00d4ff',
      })
      .returning();
    
    return this.toEntity(result);
  }

  /**
   * Update user profile
   */
  async update(
    id: string,
    data: Partial<{
      name: string;
      avatarUrl: string;
      role: string;
      starType: StarType;
      energySignatureColor: string;
      sanctumTheme: string;
      preferences: any;
    }>,
  ): Promise<UserEntity | null> {
    const [result] = await this.db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    
    return result ? this.toEntity(result) : null;
  }

  /**
   * Update orbital state
   */
  async updateOrbitalState(id: string, state: OrbitalState): Promise<UserEntity | null> {
    const [result] = await this.db
      .update(users)
      .set({
        orbitalState: state,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    
    return result ? this.toEntity(result) : null;
  }

  /**
   * Update position in void
   */
  async updatePosition(id: string, position: Position3D): Promise<UserEntity | null> {
    const [result] = await this.db
      .update(users)
      .set({
        positionX: position.x,
        positionY: position.y,
        positionZ: position.z,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    
    return result ? this.toEntity(result) : null;
  }

  /**
   * Update energy level
   */
  async updateEnergyLevel(id: string, level: number): Promise<UserEntity | null> {
    const [result] = await this.db
      .update(users)
      .set({
        currentEnergyLevel: Math.min(100, Math.max(0, level)),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    
    return result ? this.toEntity(result) : null;
  }

  /**
   * Record last active time
   */
  async recordActivity(id: string): Promise<void> {
    await this.db
      .update(users)
      .set({ lastActiveAt: new Date() })
      .where(eq(users.id, id));
  }

  /**
   * Find users with resonance connections to a user
   */
  async findResonanceConnections(userId: string): Promise<{
    user: UserEntity;
    resonanceScore: number;
  }[]> {
    const result = await this.db
      .select({
        user: users,
        resonanceScore: resonanceConnections.resonanceScore,
      })
      .from(resonanceConnections)
      .innerJoin(users, or(
        and(
          eq(resonanceConnections.userIdA, userId),
          eq(users.id, resonanceConnections.userIdB),
        ),
        and(
          eq(resonanceConnections.userIdB, userId),
          eq(users.id, resonanceConnections.userIdA),
        ),
      ))
      .where(or(
        eq(resonanceConnections.userIdA, userId),
        eq(resonanceConnections.userIdB, userId),
      ))
      .orderBy(desc(resonanceConnections.resonanceScore));
    
    return result.map(r => ({
      user: this.toEntity(r.user),
      resonanceScore: r.resonanceScore,
    }));
  }
}

// Singleton export
export const userRepository = new UserRepository();
```

### Stream Repository

```typescript
// src/repositories/stream.repository.ts
import { db } from '@/lib/db';
import { streams, streamDivers, workItems } from '@/lib/db/schema';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import { StreamEntity, StreamState } from '@/entities';

export class StreamRepository extends BaseRepository<typeof streams, StreamEntity> {
  constructor() {
    super(db, streams);
  }

  protected toEntity(row: any): StreamEntity {
    return StreamEntity.fromDatabase(row);
  }

  /**
   * Find all active streams for a team
   */
  async findActiveByTeamId(teamId: string): Promise<StreamEntity[]> {
    const result = await this.db
      .select()
      .from(streams)
      .where(and(
        eq(streams.teamId, teamId),
        isNull(streams.evaporatedAt),
      ))
      .orderBy(desc(streams.priority), desc(streams.updatedAt));
    
    return result.map(row => this.toEntity(row));
  }

  /**
   * Create new stream
   */
  async create(data: {
    teamId: string;
    name: string;
    description?: string;
    parentStreamId?: string;
    pathPoints?: any[];
  }): Promise<StreamEntity> {
    const [result] = await this.db
      .insert(streams)
      .values({
        teamId: data.teamId,
        name: data.name,
        description: data.description,
        parentStreamId: data.parentStreamId,
        pathPoints: data.pathPoints ?? [],
      })
      .returning();
    
    return this.toEntity(result);
  }

  /**
   * Update stream state
   */
  async updateState(id: string, state: StreamState): Promise<StreamEntity | null> {
    const [result] = await this.db
      .update(streams)
      .set({
        state,
        updatedAt: new Date(),
      })
      .where(eq(streams.id, id))
      .returning();
    
    return result ? this.toEntity(result) : null;
  }

  /**
   * Update stream velocity
   */
  async updateVelocity(id: string, velocity: number): Promise<StreamEntity | null> {
    const [result] = await this.db
      .update(streams)
      .set({
        velocity: Math.max(0, Math.min(2, velocity)),
        updatedAt: new Date(),
      })
      .where(eq(streams.id, id))
      .returning();
    
    return result ? this.toEntity(result) : null;
  }

  /**
   * Increment item count
   */
  async incrementItemCount(id: string): Promise<void> {
    await this.db
      .update(streams)
      .set({
        itemCount: sql`${streams.itemCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(streams.id, id));
  }

  /**
   * Record crystallization (decrement items, increment crystals)
   */
  async recordCrystallization(id: string): Promise<void> {
    await this.db
      .update(streams)
      .set({
        itemCount: sql`GREATEST(0, ${streams.itemCount} - 1)`,
        crystalCount: sql`${streams.crystalCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(streams.id, id));
  }

  /**
   * Evaporate stream (soft delete)
   */
  async evaporate(id: string): Promise<StreamEntity | null> {
    const [result] = await this.db
      .update(streams)
      .set({
        state: 'evaporated',
        evaporatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(streams.id, id))
      .returning();
    
    return result ? this.toEntity(result) : null;
  }

  /**
   * Get current divers in a stream
   */
  async getCurrentDivers(streamId: string): Promise<string[]> {
    const result = await this.db
      .select({ userId: streamDivers.userId })
      .from(streamDivers)
      .where(and(
        eq(streamDivers.streamId, streamId),
        isNull(streamDivers.surfacedAt),
      ));
    
    return result.map(r => r.userId);
  }

  /**
   * Record user diving into stream
   */
  async recordDive(streamId: string, userId: string): Promise<void> {
    await this.db
      .insert(streamDivers)
      .values({
        streamId,
        userId,
        divedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [streamDivers.streamId, streamDivers.userId],
        set: {
          divedAt: new Date(),
          surfacedAt: null,
        },
      });
  }

  /**
   * Record user surfacing from stream
   */
  async recordSurface(streamId: string, userId: string): Promise<void> {
    await this.db
      .update(streamDivers)
      .set({ surfacedAt: new Date() })
      .where(and(
        eq(streamDivers.streamId, streamId),
        eq(streamDivers.userId, userId),
        isNull(streamDivers.surfacedAt),
      ));
  }

  /**
   * Get stream with item counts by energy state
   */
  async getWithStats(id: string): Promise<{
    stream: StreamEntity;
    dormantCount: number;
    activeCount: number;
    crystalCount: number;
    diverCount: number;
  } | null> {
    const stream = await this.findById(id);
    if (!stream) return null;

    const [stats] = await this.db
      .select({
        dormant: sql<number>`count(*) filter (where ${workItems.energyState} = 'dormant')`,
        active: sql<number>`count(*) filter (where ${workItems.energyState} in ('kindling', 'blazing', 'cooling'))`,
        crystallized: sql<number>`count(*) filter (where ${workItems.energyState} = 'crystallized')`,
      })
      .from(workItems)
      .where(eq(workItems.streamId, id));

    const divers = await this.getCurrentDivers(id);

    return {
      stream,
      dormantCount: Number(stats.dormant),
      activeCount: Number(stats.active),
      crystalCount: Number(stats.crystallized),
      diverCount: divers.length,
    };
  }
}

export const streamRepository = new StreamRepository();
```

### Work Item Repository

```typescript
// src/repositories/work-item.repository.ts
import { db } from '@/lib/db';
import { workItems, workItemContributors, users } from '@/lib/db/schema';
import { eq, and, inArray, desc, asc, sql } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import { WorkItemEntity, EnergyState, WorkItemDepth } from '@/entities';

export class WorkItemRepository extends BaseRepository<typeof workItems, WorkItemEntity> {
  constructor() {
    super(db, workItems);
  }

  protected toEntity(row: any): WorkItemEntity {
    return WorkItemEntity.fromDatabase(row);
  }

  /**
   * Find all items in a stream
   */
  async findByStreamId(streamId: string): Promise<WorkItemEntity[]> {
    const result = await this.db
      .select()
      .from(workItems)
      .where(eq(workItems.streamId, streamId))
      .orderBy(asc(workItems.streamPosition));
    
    return result.map(row => this.toEntity(row));
  }

  /**
   * Find items by energy state
   */
  async findByEnergyState(
    streamId: string,
    states: EnergyState[],
  ): Promise<WorkItemEntity[]> {
    const result = await this.db
      .select()
      .from(workItems)
      .where(and(
        eq(workItems.streamId, streamId),
        inArray(workItems.energyState, states),
      ))
      .orderBy(asc(workItems.streamPosition));
    
    return result.map(row => this.toEntity(row));
  }

  /**
   * Find items assigned to a user
   */
  async findByDiverId(userId: string): Promise<WorkItemEntity[]> {
    const result = await this.db
      .select()
      .from(workItems)
      .where(eq(workItems.primaryDiverId, userId))
      .orderBy(desc(workItems.updatedAt));
    
    return result.map(row => this.toEntity(row));
  }

  /**
   * Create (spark) new work item
   */
  async create(data: {
    streamId: string;
    title: string;
    description?: string;
    depth?: WorkItemDepth;
    tags?: string[];
    createdById?: string;
  }): Promise<WorkItemEntity> {
    const [result] = await this.db
      .insert(workItems)
      .values({
        streamId: data.streamId,
        title: data.title,
        description: data.description,
        depth: data.depth ?? 'medium',
        tags: data.tags ?? [],
        energyState: 'dormant',
        energyLevel: 0,
        streamPosition: 0,
      })
      .returning();
    
    return this.toEntity(result);
  }

  /**
   * Kindle a dormant item
   */
  async kindle(id: string, diverId: string): Promise<WorkItemEntity | null> {
    const [result] = await this.db
      .update(workItems)
      .set({
        energyState: 'kindling',
        energyLevel: 10,
        primaryDiverId: diverId,
        kindledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(workItems.id, id),
        eq(workItems.energyState, 'dormant'),
      ))
      .returning();
    
    if (result) {
      // Add as contributor
      await this.addContributor(id, diverId, true);
    }
    
    return result ? this.toEntity(result) : null;
  }

  /**
   * Update energy state
   */
  async updateEnergyState(
    id: string,
    state: EnergyState,
    level?: number,
  ): Promise<WorkItemEntity | null> {
    const [result] = await this.db
      .update(workItems)
      .set({
        energyState: state,
        energyLevel: level ?? sql`${workItems.energyLevel}`,
        updatedAt: new Date(),
      })
      .where(eq(workItems.id, id))
      .returning();
    
    return result ? this.toEntity(result) : null;
  }

  /**
   * Add energy to item
   */
  async addEnergy(id: string, amount: number): Promise<WorkItemEntity | null> {
    const [result] = await this.db
      .update(workItems)
      .set({
        energyLevel: sql`LEAST(100, ${workItems.energyLevel} + ${amount})`,
        updatedAt: new Date(),
      })
      .where(eq(workItems.id, id))
      .returning();
    
    return result ? this.toEntity(result) : null;
  }

  /**
   * Advance position in stream
   */
  async advancePosition(id: string, amount: number): Promise<WorkItemEntity | null> {
    const [result] = await this.db
      .update(workItems)
      .set({
        streamPosition: sql`LEAST(1.0, ${workItems.streamPosition} + ${amount})`,
        updatedAt: new Date(),
      })
      .where(eq(workItems.id, id))
      .returning();
    
    return result ? this.toEntity(result) : null;
  }

  /**
   * Crystallize a cooling item
   */
  async crystallize(
    id: string,
    facets: number,
    brilliance: number,
  ): Promise<WorkItemEntity | null> {
    const [result] = await this.db
      .update(workItems)
      .set({
        energyState: 'crystallized',
        energyLevel: 100,
        streamPosition: 1.0,
        crystallizedAt: new Date(),
        crystalFacets: facets,
        crystalBrilliance: Math.min(5, Math.max(1, brilliance)),
        updatedAt: new Date(),
      })
      .where(and(
        eq(workItems.id, id),
        eq(workItems.energyState, 'cooling'),
      ))
      .returning();
    
    return result ? this.toEntity(result) : null;
  }

  /**
   * Add contributor to work item
   */
  async addContributor(
    workItemId: string,
    userId: string,
    isPrimary: boolean = false,
  ): Promise<void> {
    await this.db
      .insert(workItemContributors)
      .values({
        workItemId,
        userId,
        isPrimary,
        energyContributed: 0,
      })
      .onConflictDoUpdate({
        target: [workItemContributors.workItemId, workItemContributors.userId],
        set: {
          lastContributedAt: new Date(),
          isPrimary: isPrimary || sql`${workItemContributors.isPrimary}`,
        },
      });
  }

  /**
   * Record energy contribution
   */
  async recordContribution(
    workItemId: string,
    userId: string,
    energy: number,
  ): Promise<void> {
    await this.db
      .update(workItemContributors)
      .set({
        energyContributed: sql`${workItemContributors.energyContributed} + ${energy}`,
        lastContributedAt: new Date(),
      })
      .where(and(
        eq(workItemContributors.workItemId, workItemId),
        eq(workItemContributors.userId, userId),
      ));
  }

  /**
   * Get contributors for a work item
   */
  async getContributors(workItemId: string): Promise<{
    userId: string;
    energyContributed: number;
    isPrimary: boolean;
  }[]> {
    const result = await this.db
      .select({
        userId: workItemContributors.userId,
        energyContributed: workItemContributors.energyContributed,
        isPrimary: workItemContributors.isPrimary,
      })
      .from(workItemContributors)
      .where(eq(workItemContributors.workItemId, workItemId))
      .orderBy(desc(workItemContributors.energyContributed));
    
    return result;
  }

  /**
   * Transfer primary ownership
   */
  async transferOwnership(
    workItemId: string,
    fromUserId: string,
    toUserId: string,
  ): Promise<void> {
    // Remove primary from previous owner
    await this.db
      .update(workItemContributors)
      .set({ isPrimary: false })
      .where(and(
        eq(workItemContributors.workItemId, workItemId),
        eq(workItemContributors.userId, fromUserId),
      ));

    // Add/update new owner
    await this.addContributor(workItemId, toUserId, true);

    // Update work item primary diver
    await this.db
      .update(workItems)
      .set({
        primaryDiverId: toUserId,
        updatedAt: new Date(),
      })
      .where(eq(workItems.id, workItemId));
  }
}

export const workItemRepository = new WorkItemRepository();
```

### Resonance Ping Repository

```typescript
// src/repositories/resonance-ping.repository.ts
import { db } from '@/lib/db';
import { resonancePings, resonanceConnections } from '@/lib/db/schema';
import { eq, and, or, desc, lt, isNull, sql } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import { ResonancePingEntity, PingType, PingStatus } from '@/entities';

export class ResonancePingRepository extends BaseRepository<typeof resonancePings, ResonancePingEntity> {
  constructor() {
    super(db, resonancePings);
  }

  protected toEntity(row: any): ResonancePingEntity {
    return ResonancePingEntity.fromDatabase(row);
  }

  /**
   * Create and send a ping
   */
  async create(data: {
    fromUserId: string;
    toUserId: string;
    type: PingType;
    message?: string;
    relatedWorkItemId?: string;
    relatedStreamId?: string;
  }): Promise<ResonancePingEntity> {
    // Calculate expiry based on type
    const expiryHours: Record<PingType, number> = {
      gentle: 72,
      warm: 24,
      direct: 4,
    };
    const expiresAt = new Date(Date.now() + expiryHours[data.type] * 60 * 60 * 1000);

    const [result] = await this.db
      .insert(resonancePings)
      .values({
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        type: data.type,
        status: 'sent',
        message: data.message,
        relatedWorkItemId: data.relatedWorkItemId,
        relatedStreamId: data.relatedStreamId,
        expiresAt,
      })
      .returning();
    
    // Update resonance connection
    await this.incrementResonance(data.fromUserId, data.toUserId);
    
    return this.toEntity(result);
  }

  /**
   * Get inbox for a user
   */
  async getInbox(
    userId: string,
    options?: { includeRead?: boolean; limit?: number },
  ): Promise<ResonancePingEntity[]> {
    let query = this.db
      .select()
      .from(resonancePings)
      .where(and(
        eq(resonancePings.toUserId, userId),
        options?.includeRead
          ? sql`true`
          : or(
              eq(resonancePings.status, 'sent'),
              eq(resonancePings.status, 'delivered'),
            ),
      ))
      .orderBy(desc(resonancePings.sentAt));
    
    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }
    
    const result = await query;
    return result.map(row => this.toEntity(row));
  }

  /**
   * Get sent pings for a user
   */
  async getSent(userId: string, limit: number = 50): Promise<ResonancePingEntity[]> {
    const result = await this.db
      .select()
      .from(resonancePings)
      .where(eq(resonancePings.fromUserId, userId))
      .orderBy(desc(resonancePings.sentAt))
      .limit(limit);
    
    return result.map(row => this.toEntity(row));
  }

  /**
   * Mark ping as delivered
   */
  async markDelivered(id: string): Promise<ResonancePingEntity | null> {
    const [result] = await this.db
      .update(resonancePings)
      .set({
        status: 'delivered',
        deliveredAt: new Date(),
      })
      .where(and(
        eq(resonancePings.id, id),
        eq(resonancePings.status, 'sent'),
      ))
      .returning();
    
    return result ? this.toEntity(result) : null;
  }

  /**
   * Mark ping as read
   */
  async markRead(id: string): Promise<ResonancePingEntity | null> {
    const [result] = await this.db
      .update(resonancePings)
      .set({
        status: 'read',
        readAt: new Date(),
        deliveredAt: sql`COALESCE(${resonancePings.deliveredAt}, NOW())`,
      })
      .where(eq(resonancePings.id, id))
      .returning();
    
    return result ? this.toEntity(result) : null;
  }

  /**
   * Expire old pings
   */
  async expireOld(): Promise<number> {
    const result = await this.db
      .update(resonancePings)
      .set({ status: 'expired' })
      .where(and(
        lt(resonancePings.expiresAt, new Date()),
        or(
          eq(resonancePings.status, 'sent'),
          eq(resonancePings.status, 'delivered'),
        ),
      ))
      .returning({ id: resonancePings.id });
    
    return result.length;
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(resonancePings)
      .where(and(
        eq(resonancePings.toUserId, userId),
        or(
          eq(resonancePings.status, 'sent'),
          eq(resonancePings.status, 'delivered'),
        ),
      ));
    
    return Number(count);
  }

  /**
   * Get pending pings for Deep Work queue
   */
  async getPendingForDeepWork(userId: string): Promise<ResonancePingEntity[]> {
    const result = await this.db
      .select()
      .from(resonancePings)
      .where(and(
        eq(resonancePings.toUserId, userId),
        eq(resonancePings.status, 'sent'),
        // Not direct (those bypass queue)
        or(
          eq(resonancePings.type, 'gentle'),
          eq(resonancePings.type, 'warm'),
        ),
      ))
      .orderBy(resonancePings.sentAt);
    
    return result.map(row => this.toEntity(row));
  }

  /**
   * Increment resonance score between two users
   */
  private async incrementResonance(userA: string, userB: string): Promise<void> {
    // Ensure consistent ordering
    const [idA, idB] = userA < userB ? [userA, userB] : [userB, userA];

    await this.db
      .insert(resonanceConnections)
      .values({
        teamId: '00000000-0000-0000-0000-000000000000', // TODO: Get from context
        userIdA: idA,
        userIdB: idB,
        resonanceScore: 1,
        pingCount: 1,
      })
      .onConflictDoUpdate({
        target: [resonanceConnections.userIdA, resonanceConnections.userIdB],
        set: {
          resonanceScore: sql`LEAST(100, ${resonanceConnections.resonanceScore} + 1)`,
          pingCount: sql`${resonanceConnections.pingCount} + 1`,
          lastInteractionAt: new Date(),
        },
      });
  }
}

export const resonancePingRepository = new ResonancePingRepository();
```

---

## Service Layer

Services contain business logic and orchestrate operations across multiple repositories.

### User Service

```typescript
// src/services/user.service.ts
import { userRepository } from '@/repositories/user.repository';
import { UserEntity, OrbitalState, StarType, Position3D } from '@/entities';
import { z } from 'zod';

// Validation schemas
export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  password: z.string().min(8).optional(),
  avatarUrl: z.string().url().optional(),
  role: z.string().max(100).optional(),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  role: z.string().max(100).nullable().optional(),
  energySignatureColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  sanctumTheme: z.string().max(50).optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

class UserService {
  /**
   * Get user by ID
   */
  async getById(id: string): Promise<UserEntity | null> {
    return userRepository.findById(id);
  }

  /**
   * Get user by email
   */
  async getByEmail(email: string): Promise<UserEntity | null> {
    return userRepository.findByEmail(email);
  }

  /**
   * Get all team members
   */
  async getTeamMembers(teamId: string): Promise<UserEntity[]> {
    return userRepository.findByTeamId(teamId);
  }

  /**
   * Create new user
   */
  async create(input: CreateUserInput): Promise<UserEntity> {
    const validated = CreateUserSchema.parse(input);
    
    // Check for existing user
    const existing = await userRepository.findByEmail(validated.email);
    if (existing) {
      throw new Error('User with this email already exists');
    }

    // Hash password if provided
    let passwordHash: string | undefined;
    if (validated.password) {
      const bcrypt = await import('bcrypt');
      passwordHash = await bcrypt.hash(validated.password, 12);
    }

    return userRepository.create({
      email: validated.email,
      name: validated.name,
      passwordHash,
      avatarUrl: validated.avatarUrl,
      role: validated.role,
    });
  }

  /**
   * Update user profile
   */
  async update(id: string, input: UpdateUserInput): Promise<UserEntity> {
    const validated = UpdateUserSchema.parse(input);
    
    const user = await userRepository.update(id, validated);
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }

  /**
   * Change orbital state
   */
  async setOrbitalState(id: string, state: OrbitalState): Promise<UserEntity> {
    const user = await userRepository.updateOrbitalState(id, state);
    if (!user) {
      throw new Error('User not found');
    }
    
    // TODO: Trigger real-time update to connected clients
    // TODO: If entering deep work, queue pending pings
    
    return user;
  }

  /**
   * Update position in void
   */
  async setPosition(id: string, position: Position3D): Promise<UserEntity> {
    const user = await userRepository.updatePosition(id, position);
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }

  /**
   * Adjust energy level
   */
  async adjustEnergy(id: string, delta: number): Promise<UserEntity> {
    const current = await userRepository.findById(id);
    if (!current) {
      throw new Error('User not found');
    }
    
    const newLevel = Math.min(100, Math.max(0, current.currentEnergyLevel + delta));
    const user = await userRepository.updateEnergyLevel(id, newLevel);
    
    return user!;
  }

  /**
   * Get resonance connections for a user
   */
  async getResonanceConnections(userId: string): Promise<{
    user: UserEntity;
    resonanceScore: number;
  }[]> {
    return userRepository.findResonanceConnections(userId);
  }

  /**
   * Record user activity (call periodically)
   */
  async recordActivity(id: string): Promise<void> {
    await userRepository.recordActivity(id);
  }

  /**
   * Determine star type based on team context
   */
  determineStarType(role: string | null, isTeamLead: boolean): StarType {
    if (isTeamLead) return StarType.SUN;
    
    const roleLower = role?.toLowerCase() ?? '';
    if (roleLower.includes('senior') || roleLower.includes('lead')) {
      return StarType.GIANT;
    }
    if (roleLower.includes('junior') || roleLower.includes('intern')) {
      return StarType.DWARF;
    }
    if (roleLower.includes('specialist') || roleLower.includes('architect')) {
      return StarType.NEUTRON;
    }
    
    return StarType.MAIN_SEQUENCE;
  }
}

export const userService = new UserService();
```

### Stream Service

```typescript
// src/services/stream.service.ts
import { streamRepository } from '@/repositories/stream.repository';
import { workItemRepository } from '@/repositories/work-item.repository';
import { StreamEntity, StreamState, WorkItemEntity } from '@/entities';
import { z } from 'zod';

export const CreateStreamSchema = z.object({
  teamId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
});

export const UpdateStreamSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  priority: z.number().int().optional(),
});

export type CreateStreamInput = z.infer<typeof CreateStreamSchema>;
export type UpdateStreamInput = z.infer<typeof UpdateStreamSchema>;

class StreamService {
  /**
   * Get stream by ID
   */
  async getById(id: string): Promise<StreamEntity | null> {
    return streamRepository.findById(id);
  }

  /**
   * Get all active streams for a team
   */
  async getActiveStreams(teamId: string): Promise<StreamEntity[]> {
    return streamRepository.findActiveByTeamId(teamId);
  }

  /**
   * Get stream with full stats
   */
  async getWithStats(id: string) {
    return streamRepository.getWithStats(id);
  }

  /**
   * Get all items in a stream
   */
  async getStreamItems(streamId: string): Promise<WorkItemEntity[]> {
    return workItemRepository.findByStreamId(streamId);
  }

  /**
   * Create new stream
   */
  async create(input: CreateStreamInput): Promise<StreamEntity> {
    const validated = CreateStreamSchema.parse(input);
    return streamRepository.create(validated);
  }

  /**
   * Fork a stream
   */
  async fork(
    parentId: string,
    name: string,
    description?: string,
  ): Promise<StreamEntity> {
    const parent = await streamRepository.findById(parentId);
    if (!parent) {
      throw new Error('Parent stream not found');
    }

    return streamRepository.create({
      teamId: parent.teamId,
      name,
      description,
      parentStreamId: parentId,
    });
  }

  /**
   * Dive into a stream
   */
  async dive(streamId: string, userId: string): Promise<void> {
    const stream = await streamRepository.findById(streamId);
    if (!stream) {
      throw new Error('Stream not found');
    }
    if (!stream.isActive) {
      throw new Error('Cannot dive into inactive stream');
    }

    await streamRepository.recordDive(streamId, userId);
    
    // TODO: Trigger real-time update
    // TODO: Update user's orbital state if needed
  }

  /**
   * Surface from a stream
   */
  async surface(streamId: string, userId: string): Promise<void> {
    await streamRepository.recordSurface(streamId, userId);
    
    // TODO: Trigger real-time update
  }

  /**
   * Get current divers
   */
  async getCurrentDivers(streamId: string): Promise<string[]> {
    return streamRepository.getCurrentDivers(streamId);
  }

  /**
   * Update stream velocity based on activity
   */
  async recalculateVelocity(streamId: string): Promise<StreamEntity> {
    const stats = await streamRepository.getWithStats(streamId);
    if (!stats) {
      throw new Error('Stream not found');
    }

    // Calculate velocity based on:
    // - Number of active items
    // - Number of divers
    // - Recent crystallizations
    const baseVelocity = 0.5;
    const activityBonus = Math.min(0.5, stats.activeCount * 0.1);
    const diverBonus = Math.min(0.5, stats.diverCount * 0.15);
    
    const newVelocity = baseVelocity + activityBonus + diverBonus;
    
    return (await streamRepository.updateVelocity(streamId, newVelocity))!;
  }

  /**
   * Update stream state based on metrics
   */
  async evaluateHealth(streamId: string): Promise<StreamEntity> {
    const stats = await streamRepository.getWithStats(streamId);
    if (!stats) {
      throw new Error('Stream not found');
    }

    let newState: StreamState = StreamState.FLOWING;

    // Determine state based on metrics
    if (stats.stream.velocity > 1.5 && stats.activeCount > 3) {
      newState = StreamState.RUSHING;
    } else if (stats.stream.itemCount > 50) {
      newState = StreamState.FLOODING;
    } else if (stats.activeCount === 0 && stats.diverCount === 0) {
      // Check last activity time
      const hoursSinceUpdate = 
        (Date.now() - stats.stream.updatedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceUpdate > 72) {
        newState = StreamState.STAGNANT;
      }
    }

    if (newState !== stats.stream.state) {
      return (await streamRepository.updateState(streamId, newState))!;
    }

    return stats.stream;
  }

  /**
   * Evaporate (archive) a stream
   */
  async evaporate(streamId: string): Promise<StreamEntity> {
    const stream = await streamRepository.evaporate(streamId);
    if (!stream) {
      throw new Error('Stream not found');
    }
    
    // TODO: Notify divers
    // TODO: Move active items or block evaporation
    
    return stream;
  }
}

export const streamService = new StreamService();
```

### Energy Service

```typescript
// src/services/energy.service.ts
import { workItemRepository } from '@/repositories/work-item.repository';
import { streamRepository } from '@/repositories/stream.repository';
import { WorkItemEntity, EnergyState, WorkItemDepth } from '@/entities';
import { z } from 'zod';

export const SparkWorkItemSchema = z.object({
  streamId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  depth: z.enum(['shallow', 'medium', 'deep', 'abyssal']).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export type SparkWorkItemInput = z.infer<typeof SparkWorkItemSchema>;

class EnergyService {
  /**
   * Spark a new work item (create in dormant state)
   */
  async spark(input: SparkWorkItemInput, createdById: string): Promise<WorkItemEntity> {
    const validated = SparkWorkItemSchema.parse(input);
    
    // Verify stream exists and is active
    const stream = await streamRepository.findById(validated.streamId);
    if (!stream) {
      throw new Error('Stream not found');
    }
    if (!stream.isActive) {
      throw new Error('Cannot add items to inactive stream');
    }

    const item = await workItemRepository.create({
      ...validated,
      createdById,
    });

    // Update stream item count
    await streamRepository.incrementItemCount(validated.streamId);

    return item;
  }

  /**
   * Kindle a dormant item (start working on it)
   */
  async kindle(itemId: string, diverId: string): Promise<WorkItemEntity> {
    const item = await workItemRepository.findById(itemId);
    if (!item) {
      throw new Error('Work item not found');
    }
    if (!item.isDormant) {
      throw new Error('Can only kindle dormant items');
    }

    const kindled = await workItemRepository.kindle(itemId, diverId);
    if (!kindled) {
      throw new Error('Failed to kindle item');
    }

    // TODO: Trigger animation event
    // TODO: Record energy event

    return kindled;
  }

  /**
   * Infuse energy into an item
   */
  async infuseEnergy(
    itemId: string,
    contributorId: string,
    amount: number,
  ): Promise<WorkItemEntity> {
    const item = await workItemRepository.findById(itemId);
    if (!item) {
      throw new Error('Work item not found');
    }
    if (item.isCrystallized) {
      throw new Error('Cannot add energy to crystallized item');
    }
    if (item.isDormant) {
      throw new Error('Must kindle item before adding energy');
    }

    // Add contributor if not already
    await workItemRepository.addContributor(itemId, contributorId);
    
    // Record contribution
    await workItemRepository.recordContribution(itemId, contributorId, amount);

    // Add energy and check for state transitions
    const updated = await workItemRepository.addEnergy(itemId, amount);
    if (!updated) {
      throw new Error('Failed to add energy');
    }

    // Auto-transition based on energy level
    return this.evaluateStateTransition(updated);
  }

  /**
   * Evaluate and perform automatic state transitions
   */
  private async evaluateStateTransition(item: WorkItemEntity): Promise<WorkItemEntity> {
    let newState = item.energyState;
    let newLevel = item.energyLevel;

    if (item.energyState === EnergyState.KINDLING && item.energyLevel >= 70) {
      newState = EnergyState.BLAZING;
    } else if (item.energyState === EnergyState.BLAZING && item.energyLevel >= 95) {
      // High energy sustained - might be ready to cool
      // (Usually manual transition to cooling)
    }

    if (newState !== item.energyState) {
      const updated = await workItemRepository.updateEnergyState(item.id, newState);
      return updated ?? item;
    }

    return item;
  }

  /**
   * Transition to cooling state (preparing to complete)
   */
  async startCooling(itemId: string): Promise<WorkItemEntity> {
    const item = await workItemRepository.findById(itemId);
    if (!item) {
      throw new Error('Work item not found');
    }
    if (item.energyState !== EnergyState.BLAZING) {
      throw new Error('Can only cool blazing items');
    }

    const cooled = await workItemRepository.updateEnergyState(
      itemId,
      EnergyState.COOLING,
      60,
    );

    return cooled!;
  }

  /**
   * Crystallize a cooling item (complete it)
   */
  async crystallize(itemId: string): Promise<WorkItemEntity> {
    const item = await workItemRepository.findById(itemId);
    if (!item) {
      throw new Error('Work item not found');
    }
    if (item.energyState !== EnergyState.COOLING) {
      throw new Error('Can only crystallize cooling items');
    }

    // Get contributors for facet count
    const contributors = await workItemRepository.getContributors(itemId);
    const facets = contributors.length;

    // Calculate brilliance based on depth and energy contributed
    const totalEnergy = contributors.reduce((sum, c) => sum + c.energyContributed, 0);
    const depthMultiplier = item.depthMultiplier;
    const brilliance = Math.min(5, Math.ceil((totalEnergy / 100) * depthMultiplier));

    const crystallized = await workItemRepository.crystallize(itemId, facets, brilliance);
    if (!crystallized) {
      throw new Error('Failed to crystallize');
    }

    // Update stream crystal count
    await streamRepository.recordCrystallization(item.streamId);

    // TODO: Trigger crystallization ceremony animation
    // TODO: Record energy event
    // TODO: Update resonance scores between contributors

    return crystallized;
  }

  /**
   * Pass the torch (transfer ownership)
   */
  async passTheTorch(
    itemId: string,
    fromUserId: string,
    toUserId: string,
  ): Promise<WorkItemEntity> {
    const item = await workItemRepository.findById(itemId);
    if (!item) {
      throw new Error('Work item not found');
    }
    if (item.primaryDiverId !== fromUserId) {
      throw new Error('Only primary diver can pass the torch');
    }
    if (item.isCrystallized) {
      throw new Error('Cannot transfer crystallized item');
    }

    await workItemRepository.transferOwnership(itemId, fromUserId, toUserId);

    const updated = await workItemRepository.findById(itemId);
    
    // TODO: Trigger animation
    // TODO: Send ping to new owner

    return updated!;
  }

  /**
   * Get work items for a user
   */
  async getMyWorkItems(userId: string): Promise<WorkItemEntity[]> {
    return workItemRepository.findByDiverId(userId);
  }

  /**
   * Advance item position in stream (called periodically or on energy add)
   */
  async advancePosition(itemId: string): Promise<WorkItemEntity> {
    const item = await workItemRepository.findById(itemId);
    if (!item) {
      throw new Error('Work item not found');
    }

    // Calculate advancement based on energy level and state
    const stateMultipliers: Record<EnergyState, number> = {
      [EnergyState.DORMANT]: 0,
      [EnergyState.KINDLING]: 0.01,
      [EnergyState.BLAZING]: 0.03,
      [EnergyState.COOLING]: 0.02,
      [EnergyState.CRYSTALLIZED]: 0,
    };

    const advancement = stateMultipliers[item.energyState] * (item.energyLevel / 100);
    
    if (advancement > 0) {
      const updated = await workItemRepository.advancePosition(itemId, advancement);
      return updated!;
    }

    return item;
  }
}

export const energyService = new EnergyService();
```

### Resonance Service

```typescript
// src/services/resonance.service.ts
import { resonancePingRepository } from '@/repositories/resonance-ping.repository';
import { userRepository } from '@/repositories/user.repository';
import { ResonancePingEntity, PingType, OrbitalState } from '@/entities';
import { z } from 'zod';

export const SendPingSchema = z.object({
  toUserId: z.string().uuid(),
  type: z.enum(['gentle', 'warm', 'direct']),
  message: z.string().max(500).optional(),
  relatedWorkItemId: z.string().uuid().optional(),
  relatedStreamId: z.string().uuid().optional(),
});

export type SendPingInput = z.infer<typeof SendPingSchema>;

class ResonanceService {
  /**
   * Send a resonance ping
   */
  async sendPing(
    fromUserId: string,
    input: SendPingInput,
  ): Promise<ResonancePingEntity> {
    const validated = SendPingSchema.parse(input);

    // Verify recipient exists
    const recipient = await userRepository.findById(validated.toUserId);
    if (!recipient) {
      throw new Error('Recipient not found');
    }

    // Check if recipient can receive this type of ping
    if (!recipient.canReceivePing(validated.type)) {
      if (validated.type === 'direct') {
        // Direct always goes through, but may be queued
      } else {
        throw new Error(
          `Cannot send ${validated.type} ping to user in ${recipient.orbitalState} state`
        );
      }
    }

    const ping = await resonancePingRepository.create({
      fromUserId,
      toUserId: validated.toUserId,
      type: validated.type as PingType,
      message: validated.message,
      relatedWorkItemId: validated.relatedWorkItemId,
      relatedStreamId: validated.relatedStreamId,
    });

    // Handle delivery based on recipient's state
    await this.handlePingDelivery(ping, recipient.orbitalState);

    return ping;
  }

  /**
   * Handle ping delivery based on recipient state
   */
  private async handlePingDelivery(
    ping: ResonancePingEntity,
    recipientState: OrbitalState,
  ): Promise<void> {
    const shouldDeliver = 
      recipientState === OrbitalState.OPEN ||
      recipientState === OrbitalState.SUPERNOVA ||
      ping.type === PingType.DIRECT;

    if (shouldDeliver) {
      await resonancePingRepository.markDelivered(ping.id);
      
      // TODO: Push real-time notification
      // TODO: Trigger ping travel animation via WebSocket
    }
    // Otherwise, ping stays in 'sent' status until recipient surfaces
  }

  /**
   * Get inbox for a user
   */
  async getInbox(
    userId: string,
    options?: { includeRead?: boolean; limit?: number },
  ): Promise<ResonancePingEntity[]> {
    return resonancePingRepository.getInbox(userId, options);
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return resonancePingRepository.getUnreadCount(userId);
  }

  /**
   * Mark ping as read
   */
  async markRead(pingId: string, userId: string): Promise<ResonancePingEntity> {
    const ping = await resonancePingRepository.findById(pingId);
    if (!ping) {
      throw new Error('Ping not found');
    }
    if (ping.toUserId !== userId) {
      throw new Error('Cannot mark others\' pings as read');
    }

    const updated = await resonancePingRepository.markRead(pingId);
    return updated!;
  }

  /**
   * Deliver queued pings when user surfaces from deep work
   */
  async deliverQueuedPings(userId: string): Promise<ResonancePingEntity[]> {
    const queued = await resonancePingRepository.getPendingForDeepWork(userId);
    
    const delivered: ResonancePingEntity[] = [];
    for (const ping of queued) {
      const updated = await resonancePingRepository.markDelivered(ping.id);
      if (updated) {
        delivered.push(updated);
        // TODO: Send real-time notification
      }
    }

    return delivered;
  }

  /**
   * Get resonance connections for a user
   */
  async getConnections(userId: string): Promise<{
    userId: string;
    name: string;
    resonanceScore: number;
  }[]> {
    const connections = await userRepository.findResonanceConnections(userId);
    
    return connections.map(c => ({
      userId: c.user.id,
      name: c.user.name,
      resonanceScore: c.resonanceScore,
    }));
  }

  /**
   * Expire old pings (run as scheduled job)
   */
  async expireOldPings(): Promise<number> {
    return resonancePingRepository.expireOld();
  }
}

export const resonanceService = new ResonanceService();
```

---

## Dependency Injection Pattern

For testing and flexibility, services can be injected:

```typescript
// src/lib/container.ts
import { UserRepository, userRepository } from '@/repositories/user.repository';
import { StreamRepository, streamRepository } from '@/repositories/stream.repository';
import { WorkItemRepository, workItemRepository } from '@/repositories/work-item.repository';
import { ResonancePingRepository, resonancePingRepository } from '@/repositories/resonance-ping.repository';

export interface Container {
  userRepository: UserRepository;
  streamRepository: StreamRepository;
  workItemRepository: WorkItemRepository;
  resonancePingRepository: ResonancePingRepository;
}

export const defaultContainer: Container = {
  userRepository,
  streamRepository,
  workItemRepository,
  resonancePingRepository,
};

// For testing, create mock container
export function createMockContainer(overrides: Partial<Container> = {}): Container {
  return {
    ...defaultContainer,
    ...overrides,
  };
}
```

---

## Usage in API Routes

```typescript
// src/app/api/work-items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { energyService, SparkWorkItemSchema } from '@/services/energy.service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const input = SparkWorkItemSchema.parse(body);
    
    const workItem = await energyService.spark(input, session.user.id);
    
    return NextResponse.json(workItem, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating work item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## Server Actions

```typescript
// src/app/actions/energy.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { energyService } from '@/services/energy.service';

export async function sparkWorkItem(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const input = {
    streamId: formData.get('streamId') as string,
    title: formData.get('title') as string,
    description: formData.get('description') as string | undefined,
    depth: formData.get('depth') as 'shallow' | 'medium' | 'deep' | 'abyssal' | undefined,
  };

  const item = await energyService.spark(input, session.user.id);
  
  revalidatePath(`/streams/${input.streamId}`);
  
  return item;
}

export async function kindleWorkItem(itemId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const item = await energyService.kindle(itemId, session.user.id);
  
  revalidatePath(`/streams/${item.streamId}`);
  
  return item;
}

export async function crystallizeWorkItem(itemId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const item = await energyService.crystallize(itemId);
  
  revalidatePath(`/streams/${item.streamId}`);
  revalidatePath('/observatory');
  
  return item;
}
```
