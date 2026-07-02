/**
 * JWT-based auth context. Replaces the previous Supabase-backed provider.
 * All auth flows go through authService → Spring Boot AuthController.
 */
import { useEffect, useState, useCallback, createContext, useContext, type ReactNode } from "react";
import { authService } from "@/services/authService";
import { tokenStore } from "@/lib/api-client";
import type { LoginRequest, RegisterRequest, Role, UserDto } from "@/types/api";

export type AppRole = "admin" | "doctor" | "receptionist" | "patient";

const ROLE_MAP: Record<Role, AppRole> = {
  ADMIN: "admin",
  DOCTOR: "doctor",
  RECEPTIONIST: "receptionist",
  PATIENT: "patient",
};

interface AuthState {
  user: UserDto | null;
  roles: AppRole[];
  loading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async () => {
    if (!tokenStore.getAccess()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await authService.me();
      setUser(me);
    } catch {
      tokenStore.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Read cached user immediately for instant UI, then re-verify with backend.
    const cached = tokenStore.getUser<UserDto>();
    if (cached) setUser(cached);
    hydrate();
  }, [hydrate]);

  const login = useCallback(async (payload: LoginRequest) => {
    const res = await authService.login(payload);
    setUser(res.user);
  }, []);

  const register = useCallback(async (payload: RegisterRequest) => {
    const res = await authService.register(payload);
    setUser(res.user);
  }, []);

  const signOut = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const roles: AppRole[] = user ? [ROLE_MAP[user.role]] : [];

  return (
    <AuthCtx.Provider value={{ user, roles, loading, login, register, signOut, refreshRoles: hydrate }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function pickHomePath(roles: AppRole[]): string {
  if (roles.includes("admin")) return "/admin";
  if (roles.includes("doctor")) return "/doctor";
  if (roles.includes("receptionist")) return "/reception";
  return "/patient";
}
