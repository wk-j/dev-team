"use client";

import { useState, useEffect, useCallback } from "react";
import { api, Stream, WorkItem } from "./client";

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

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    try {
      setIsLoading(true);
      const result = await fetcher();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!pollInterval || !enabled) return;

    const interval = setInterval(fetchData, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval, enabled, fetchData]);

  return { data, error, isLoading, refetch: fetchData };
}

// Streams hooks
export function useStreams(options?: UseDataOptions): UseDataResult<Stream[]> {
  return useData(() => api.getStreams(), options);
}

export function useStream(
  id: string,
  options?: UseDataOptions
): UseDataResult<Stream & { workItems: WorkItem[] }> {
  return useData(() => api.getStream(id), { ...options, enabled: !!id });
}

// Work items hooks
export function useWorkItems(
  filters?: { streamId?: string; energyState?: string; userId?: string },
  options?: UseDataOptions
): UseDataResult<WorkItem[]> {
  return useData(() => api.getWorkItems(filters), options);
}

export function useWorkItem(
  id: string,
  options?: UseDataOptions
): UseDataResult<WorkItem> {
  return useData(() => api.getWorkItem(id), { ...options, enabled: !!id });
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
