"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../lib/api-client";

export type User = {
  userId: string;
  phoneNumber: string;
  fullName: string;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  dateOfBirth: string | null;
  avatarUrl: string | null;
  bio: string | null;
  preferredPosition: "GK" | "DF" | "MF" | "FW" | null;
  role: "PLAYER" | "FIELD_OWNER" | "ADMIN";
  accountStatus: "ACTIVE" | "BLOCKED" | "DELETED";
  verificationStatus: "UNVERIFIED" | "VERIFIED";
  createdAt: string;
  updatedAt: string;
};

type Session = { accessToken: string; user: User };
type AuthContextValue = {
  user: User | null;
  token: string | null;
  ready: boolean;
  login(phoneNumber: string, password: string): Promise<void>;
  logout(): Promise<void>;
  refreshProfile(): Promise<void>;
  updateProfile(data: Partial<User>): Promise<void>;
};

const SESSION_KEY = "keo-the-thao.session";
const AuthContext = createContext<AuthContextValue | null>(null);

function saveSession(session: Session | null) {
  if (typeof window === "undefined") return;
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) setSession(JSON.parse(saved) as Session);
    } finally {
      setReady(true);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      token: session?.accessToken ?? null,
      ready,
      async login(phoneNumber, password) {
        const result = await apiRequest<{ data: Session }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ phoneNumber, password })
        });
        setSession(result.data);
        saveSession(result.data);
      },
      async logout() {
        if (session?.accessToken) {
          try {
            await apiRequest("/auth/logout", { method: "POST" }, session.accessToken);
          } catch {
            // Local logout must still succeed if the token has expired.
          }
        }
        setSession(null);
        saveSession(null);
      },
      async refreshProfile() {
        if (!session) return;
        const result = await apiRequest<{ data: User }>("/users/me", {}, session.accessToken);
        const next = { ...session, user: result.data };
        setSession(next);
        saveSession(next);
      },
      async updateProfile(data) {
        if (!session) throw new Error("Bạn cần đăng nhập để cập nhật hồ sơ");
        const result = await apiRequest<{ data: User }>(
          "/users/me",
          { method: "PATCH", body: JSON.stringify(data) },
          session.accessToken
        );
        const next = { ...session, user: result.data };
        setSession(next);
        saveSession(next);
      }
    }),
    [ready, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth phải được dùng trong AuthProvider");
  return context;
}
