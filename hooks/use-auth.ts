import { useCallback, useEffect, useMemo, useState } from "react";
import * as Auth from "@/lib/_core/auth";
import { supabase } from "@/lib/supabase";

type UseAuthOptions = { autoFetch?: boolean };

/** Current Supabase user, kept in sync with sign-in / sign-out events. */
export function useAuth(options?: UseAuthOptions) {
  const { autoFetch = true } = options ?? {};
  const [user, setUser] = useState<Auth.User | null>(null);
  const [loading, setLoading] = useState(autoFetch && Boolean(supabase));
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setUser(await Auth.getUserInfo());
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load user"));
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!autoFetch || !supabase) { setLoading(false); return; }
    void refresh();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? Auth.toAppUser(session.user) : null);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, [autoFetch, refresh]);

  const logout = useCallback(async () => {
    await Auth.signOut();
    setUser(null);
    setError(null);
  }, []);

  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  return { user, loading, error, isAuthenticated, refresh, logout };
}
