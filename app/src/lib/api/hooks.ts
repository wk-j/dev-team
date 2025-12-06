"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api, Stream, WorkItem, PingInbox, Ping, PingType, PingStatus } from "./client";

interface UseDataOptions {
  pollInterval?: number;
  enabled?: boolean;
}

interface UseDataResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

// Generic hook for fetching data
function useData<T>(
  fetcher: () => Promise<T>,
  options: UseDataOptions = {}
): UseDataResult<T> {
  const { pollInterval, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetcherRef = useRef(fetcher);
  const isMountedRef = useRef(true);

  // Keep fetcher ref updated
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    try {
      const result = await fetcherRef.current();
      if (isMountedRef.current) {
        setData(result);
        setError(null);
        setIsLoading(false);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setIsLoading(false);
      }
    }
  }, [enabled]);

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true;
    fetchData();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  // Polling
  useEffect(() => {
    if (!pollInterval || !enabled) return;

    const interval = setInterval(fetchData, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval, enabled, fetchData]);

  return { data, error, isLoading, refetch: fetchData };
}

// Streams hooks
export function useStreams(options?: UseDataOptions): UseDataResult<Stream[]> {
  const fetcher = useCallback(() => api.getStreams(), []);
  return useData(fetcher, options);
}

export function useStream(
  id: string,
  options?: UseDataOptions
): UseDataResult<Stream & { workItems: WorkItem[] }> {
  const fetcher = useCallback(() => api.getStream(id), [id]);
  return useData(fetcher, { ...options, enabled: !!id });
}

// Work items hooks
export function useWorkItems(
  filters?: { streamId?: string; energyState?: string; userId?: string },
  options?: UseDataOptions
): UseDataResult<WorkItem[]> {
  const fetcher = useCallback(
    () => api.getWorkItems(filters), 
    [filters?.streamId, filters?.energyState, filters?.userId]
  );
  return useData(fetcher, options);
}

export function useWorkItem(
  id: string,
  options?: UseDataOptions
): UseDataResult<WorkItem> {
  const fetcher = useCallback(() => api.getWorkItem(id), [id]);
  return useData(fetcher, { ...options, enabled: !!id });
}

// Mutation hooks
export function useCreateStream() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createStream = useCallback(
    async (data: { name: string; description?: string }) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await api.createStream(data);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { createStream, isLoading, error };
}

export function useCreateWorkItem() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createWorkItem = useCallback(
    async (data: {
      streamId: string;
      title: string;
      description?: string;
      depth?: WorkItem["depth"];
      tags?: string[];
    }) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await api.createWorkItem(data);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { createWorkItem, isLoading, error };
}

export function useUpdateWorkItem() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateWorkItem = useCallback(
    async (
      id: string,
      data: Partial<
        Pick<WorkItem, "title" | "description" | "depth" | "tags" | "energyState" | "energyLevel">
      >
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await api.updateWorkItem(id, data);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const kindleWorkItem = useCallback(async (id: string) => {
    return updateWorkItem(id, { energyState: "kindling" });
  }, [updateWorkItem]);

  const crystallizeWorkItem = useCallback(async (id: string) => {
    return updateWorkItem(id, { energyState: "crystallized" });
  }, [updateWorkItem]);

  return { updateWorkItem, kindleWorkItem, crystallizeWorkItem, isLoading, error };
}

// Dive mode hooks
export function useDiveMode() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentDive, setCurrentDive] = useState<{
    streamId: string;
    divedAt: string;
  } | null>(null);

  const diveIntoStream = useCallback(async (streamId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.diveIntoStream(streamId);
      setCurrentDive({
        streamId: result.stream.id,
        divedAt: result.dive.divedAt,
      });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const surfaceFromStream = useCallback(async (streamId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.surfaceFromStream(streamId);
      setCurrentDive(null);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    diveIntoStream,
    surfaceFromStream,
    currentDive,
    isLoading,
    error,
  };
}

// Pings hooks
export function usePings(
  filters?: { status?: PingStatus; type?: PingType; direction?: "received" | "sent" },
  options?: UseDataOptions
): UseDataResult<PingInbox> {
  const fetcher = useCallback(
    () => api.getPings(filters),
    [filters?.status, filters?.type, filters?.direction]
  );
  return useData(fetcher, options);
}

export function usePing(id: string, options?: UseDataOptions): UseDataResult<Ping> {
  const fetcher = useCallback(() => api.getPing(id), [id]);
  return useData(fetcher, { ...options, enabled: !!id });
}

export function useSendPing() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendPing = useCallback(
    async (data: {
      toUserId: string;
      type: PingType;
      message?: string;
      relatedWorkItemId?: string;
      relatedStreamId?: string;
    }) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await api.sendPing(data);
        return result.ping;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { sendPing, isLoading, error };
}

export function useMarkPingAsRead() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const markAsRead = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.markPingAsRead(id);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { markAsRead, isLoading, error };
}

// Handoff hook
export function useHandoffWorkItem() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handoff = useCallback(
    async (workItemId: string, toUserId: string, message?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await api.handoffWorkItem(workItemId, toUserId, message);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { handoff, isLoading, error };
}

// Team hooks
export function useTeam(options?: UseDataOptions) {
  const fetcher = useCallback(() => api.getTeam(), []);
  return useData(fetcher, options);
}
