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
}

export const api = new ApiClient();
