"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { AuthErrorResponse, AuthSessionResponse, PublicSession } from "@/types";

const unauthenticatedSession: PublicSession = {
  authenticated: false,
  user: null,
  plan: null,
  role: null,
  expiresAt: null,
};

type AuthSessionContextValue = {
  loading: boolean;
  refreshSession: () => Promise<PublicSession>;
  session: PublicSession;
};

const defaultAuthSessionContext: AuthSessionContextValue = {
  loading: false,
  refreshSession: async () => unauthenticatedSession,
  session: unauthenticatedSession,
};

const AuthSessionContext = createContext<AuthSessionContextValue>(defaultAuthSessionContext);

export function AuthSessionProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: PublicSession;
}) {
  const [session, setSession] = useState<PublicSession>(initialSession);
  const [loading, setLoading] = useState(false);

  const refreshSession = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/auth/session", {
        cache: "no-store",
      });
      const payload = (await response.json()) as AuthSessionResponse | AuthErrorResponse;

      if (!response.ok || !("authenticated" in payload)) {
        setSession(unauthenticatedSession);
        return unauthenticatedSession;
      }

      setSession(payload);
      return payload;
    } catch {
      setSession(unauthenticatedSession);
      return unauthenticatedSession;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      loading,
      refreshSession,
      session,
    }),
    [loading, refreshSession, session],
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  return useContext(AuthSessionContext);
}
