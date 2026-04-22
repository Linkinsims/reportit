import { useState, useEffect, useCallback } from "react";
import { SupabaseClient } from "@supabase/supabase-js";

type QueryFn<T> = () => Promise<T>;

interface UseQueryOptions<T> {
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useQuery<T>(
  queryFn: QueryFn<T>,
  options: UseQueryOptions<T> = {},
) {
  const { enabled = true, onSuccess, onError } = options;
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await queryFn();
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [queryFn, enabled, onSuccess, onError]);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
}

export function useMutation<T, V = unknown>(
  mutationFn: (variables: V) => Promise<T>,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (variables: V) => {
    setLoading(true);
    setError(null);
    try {
      const result = await mutationFn(variables);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}

// Hook for realtime subscriptions (optional enhancement)
export function useRealtime<T>(
  supabase: SupabaseClient,
  table: string,
  filter?: { column: string; value: string | number },
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const subscription = supabase
      .channel(`public:${table}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          ...(filter && { filter: `column=${filter.column}=${filter.value}` }),
        },
        (payload) => {
          setData((current) => {
            // Simplified - you might want to handle insert/update/delete differently
            return [...current, payload.new as T];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [supabase, table, filter]);

  return { data, loading };
}
