// API client for fetching data from the server

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string | null;
  starType: "sun" | "giant" | "main_sequence" | "dwarf" | "neutron";
  orbitalState: "open" | "focused" | "deep_work" | "away" | "supernova";
  energySignatureColor: string;
  positionX: number;
  positionY: number;
  positionZ: number;
  currentEnergyLevel: number;
  lastActiveAt: string | null;
}

export interface StreamDiver {
  id: string;
  name: string;
  avatarUrl: string | null;
  starType: string;
  orbitalState: string;
  energySignatureColor: string;
  divedAt: string;
}

export interface Stream {
  id: string;
  teamId: string;
  name: string;
  description: string | null;
  state: "nascent" | "flowing" | "rushing" | "flooding" | "stagnant" | "evaporated";
  velocity: number;
  pathPoints: Array<{ x: number; y: number; z: number; t: number }>;
  itemCount: number;
  crystalCount: number;
  divers: StreamDiver[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkItemContributor {
  id: string;
  name: string;
  avatarUrl: string | null;
  energyContributed: number;
  isPrimary: boolean;
}

export interface WorkItem {
  id: string;
  streamId: string;
  title: string;
  description: string | null;
  energyState: "dormant" | "kindling" | "blazing" | "cooling" | "crystallized";
  energyLevel: number;
  depth: "shallow" | "medium" | "deep" | "abyssal";
  streamPosition: number;
  primaryDiverId: string | null;
  tags: string[];
  contributors: WorkItemContributor[];
  createdAt: string;
  updatedAt: string;
  kindledAt: string | null;
  crystallizedAt: string | null;
  crystalFacets: number | null;
  crystalBrilliance: number | null;
}

export interface ObservatoryMetrics {
  teamPulse: number;
  activeStreams: number;
  rushingStreams: number;
  crystalsToday: number;
  crystalsDelta: number;
  teamOnline: number;
  teamTotal: number;
  inDeepWork: number;
}

export type PingType = "gentle" | "warm" | "direct";
export type PingStatus = "sent" | "delivered" | "read" | "expired";

export interface PingUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  starType: string;
  orbitalState: string;
  energySignatureColor: string;
}

export interface Ping {
  id: string;
  type: PingType;
  status: PingStatus;
  message: string | null;
  relatedWorkItemId: string | null;
  relatedStreamId: string | null;
  sentAt: string;
  deliveredAt: string | null;
  readAt: string | null;
  expiresAt: string | null;
  fromUser: PingUser;
  toUser?: PingUser;
}

export interface PingInbox {
  pings: Ping[];
  unreadCount: number;
}

class ApiClient {
  private baseUrl = "/api";

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `API error: ${response.status}`);
    }

    return response.json();
  }

  // Streams
  async getStreams(): Promise<Stream[]> {
    return this.fetch<Stream[]>("/streams");
  }

  async getStream(id: string): Promise<Stream & { workItems: WorkItem[] }> {
    return this.fetch(`/streams/${id}`);
  }

  async createStream(data: { name: string; description?: string }): Promise<Stream> {
    return this.fetch("/streams", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateStream(
    id: string,
    data: Partial<Pick<Stream, "name" | "description" | "state" | "velocity">>
  ): Promise<Stream> {
    return this.fetch(`/streams/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteStream(id: string): Promise<void> {
    return this.fetch(`/streams/${id}`, { method: "DELETE" });
  }

  async diveIntoStream(id: string): Promise<{
    dive: { id: string; streamId: string; userId: string; divedAt: string };
    stream: Stream;
    divers: StreamDiver[];
  }> {
    return this.fetch(`/streams/${id}/dive`, { method: "POST" });
  }

  async surfaceFromStream(id: string): Promise<{
    surfaced: { id: string; streamId: string; userId: string; surfacedAt: string };
    diveDuration: number;
    stream: Stream;
    remainingDivers: StreamDiver[];
  }> {
    return this.fetch(`/streams/${id}/surface`, { method: "POST" });
  }

  // Work Items
  async getWorkItems(filters?: {
    streamId?: string;
    energyState?: string;
    userId?: string;
  }): Promise<WorkItem[]> {
    const params = new URLSearchParams();
    if (filters?.streamId) params.set("streamId", filters.streamId);
    if (filters?.energyState) params.set("energyState", filters.energyState);
    if (filters?.userId) params.set("userId", filters.userId);

    const query = params.toString();
    return this.fetch<WorkItem[]>(`/work-items${query ? `?${query}` : ""}`);
  }

  async getWorkItem(id: string): Promise<WorkItem> {
    return this.fetch(`/work-items/${id}`);
  }

  async createWorkItem(data: {
    streamId: string;
    title: string;
    description?: string;
    depth?: WorkItem["depth"];
    tags?: string[];
  }): Promise<WorkItem> {
    return this.fetch("/work-items", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateWorkItem(
    id: string,
    data: Partial<Pick<WorkItem, "title" | "description" | "depth" | "tags" | "energyState" | "energyLevel">>
  ): Promise<WorkItem> {
    return this.fetch(`/work-items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async kindleWorkItem(id: string): Promise<WorkItem> {
    return this.updateWorkItem(id, { energyState: "kindling" });
  }

  async crystallizeWorkItem(id: string): Promise<WorkItem> {
    return this.updateWorkItem(id, { energyState: "crystallized" });
  }

  async deleteWorkItem(id: string): Promise<void> {
    return this.fetch(`/work-items/${id}`, { method: "DELETE" });
  }

  async assignWorkItem(
    id: string,
    toUserId: string,
    message?: string
  ): Promise<{
    workItem: WorkItem;
    assignment: {
      from: { id: string; name: string; avatarUrl: string | null };
      to: { id: string; name: string; avatarUrl: string | null };
      message?: string;
      assignedAt: string;
    };
  }> {
    return this.fetch(`/work-items/${id}/assign`, {
      method: "POST",
      body: JSON.stringify({ toUserId, message }),
    });
  }

  async handoffWorkItem(
    id: string,
    toUserId: string,
    message?: string
  ): Promise<{
    workItem: WorkItem;
    handoff: {
      from: { id: string; name: string; avatarUrl: string | null };
      to: { id: string; name: string; avatarUrl: string | null };
      message?: string;
      handedOffAt: string;
    };
  }> {
    return this.fetch(`/work-items/${id}/handoff`, {
      method: "POST",
      body: JSON.stringify({ toUserId, message }),
    });
  }

  // Pings
  async getPings(filters?: {
    status?: PingStatus;
    type?: PingType;
    direction?: "received" | "sent";
  }): Promise<PingInbox> {
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (filters?.type) params.set("type", filters.type);
    if (filters?.direction) params.set("direction", filters.direction);

    const query = params.toString();
    return this.fetch<PingInbox>(`/pings${query ? `?${query}` : ""}`);
  }

  async getPing(id: string): Promise<Ping> {
    return this.fetch(`/pings/${id}`);
  }

  async sendPing(data: {
    toUserId: string;
    type: PingType;
    message?: string;
    relatedWorkItemId?: string;
    relatedStreamId?: string;
  }): Promise<{ ping: Ping }> {
    return this.fetch("/pings", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async markPingAsRead(id: string): Promise<Ping> {
    return this.fetch(`/pings/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "read" }),
    });
  }

  async deletePing(id: string): Promise<void> {
    return this.fetch(`/pings/${id}`, { method: "DELETE" });
  }

  // Team
  async getTeam(): Promise<{
    id: string;
    name: string;
    description: string | null;
    currentUserRole: string;
    members: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      avatarUrl: string | null;
      userRole: string | null;
      starType: string;
      orbitalState: string;
      energySignatureColor: string;
      joinedAt: string;
      lastActiveAt: string | null;
    }>;
  }> {
    return this.fetch("/team");
  }

  // Users - Team members with enhanced data (resonance, positions, etc.)
  async getUsers(): Promise<Array<{
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    role: string | null;
    starType: "sun" | "giant" | "main_sequence" | "dwarf" | "neutron";
    energySignatureColor: string;
    orbitalState: "open" | "focused" | "deep_work" | "away" | "supernova";
    positionX: number;
    positionY: number;
    positionZ: number;
    currentEnergyLevel: number;
    lastActiveAt: string | null;
    createdAt: string;
    membershipRole: string;
    joinedAt: string;
    resonanceScore: number | null;
  }>> {
    return this.fetch("/users");
  }

  async getUser(id: string): Promise<{
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    role: string | null;
    starType: "sun" | "giant" | "main_sequence" | "dwarf" | "neutron";
    energySignatureColor: string;
    orbitalState: "open" | "focused" | "deep_work" | "away" | "supernova";
    positionX: number;
    positionY: number;
    positionZ: number;
    currentEnergyLevel: number;
    lastActiveAt: string | null;
    createdAt: string;
    membershipRole: string;
    joinedAt: string;
    stats: {
      totalContributions: number;
      resonanceScore: number;
    };
  }> {
    return this.fetch(`/users/${id}`);
  }

  async updateOrbitalState(orbitalState: "open" | "focused" | "deep_work" | "away" | "supernova"): Promise<{
    user: {
      id: string;
      orbitalState: string;
    };
    previousState: string;
    message: string;
  }> {
    return this.fetch("/me/orbital-state", {
      method: "PATCH",
      body: JSON.stringify({ orbitalState }),
    });
  }

  // Current user
  async getMe(): Promise<{
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    role: string | null;
    starType: "sun" | "giant" | "main_sequence" | "dwarf" | "neutron";
    energySignatureColor: string;
    orbitalState: "open" | "focused" | "deep_work" | "away" | "supernova";
    team: {
      teamId: string;
      role: string;
      teamName: string;
    } | null;
  }> {
    return this.fetch("/me");
  }
}

export const api = new ApiClient();
