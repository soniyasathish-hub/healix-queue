/**
 * Central Axios instance for the Spring Boot REST API.
 *
 * Features:
 *  - baseURL from VITE_API_BASE_URL
 *  - JWT auto-attached from localStorage
 *  - Automatic refresh-token flow on 401 (single-flight to avoid stampedes)
 *  - Global error normalization → throws ApiError
 *  - Simple retry for idempotent GETs on network errors (max 2)
 */
import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { toast } from "sonner";
import type { ApiError, AuthResponse } from "@/types/api";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";
const TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT ?? 15000);

const TOKEN_KEY = "queueless.accessToken";
const REFRESH_KEY = "queueless.refreshToken";
const USER_KEY = "queueless.user";

/* ─────── Token helpers (also usable outside axios) ─────── */
export const tokenStore = {
  getAccess: () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: (t: { accessToken: string; refreshToken: string }) => {
    localStorage.setItem(TOKEN_KEY, t.accessToken);
    localStorage.setItem(REFRESH_KEY, t.refreshToken);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
  setUser: (u: unknown) => localStorage.setItem(USER_KEY, JSON.stringify(u)),
  getUser: <T = unknown>(): T | null => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  },
};

/* ─────── Axios instance ─────── */
export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: { "Content-Type": "application/json" },
});

/* ─────── Request interceptor: attach JWT ─────── */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.getAccess();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ─────── Refresh single-flight ─────── */
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;
  const refresh = tokenStore.getRefresh();
  if (!refresh) throw new Error("No refresh token");

  refreshPromise = axios
    .post<AuthResponse>(`${BASE_URL}/auth/refresh`, { refreshToken: refresh })
    .then((res) => {
      tokenStore.set({
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      });
      return res.data.accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

/* ─────── Response interceptor: refresh + normalize errors ─────── */
api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError<ApiError>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    // 401 → try to refresh once, then replay
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        const newToken = await refreshAccessToken();
        if (original.headers) original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        tokenStore.clear();
        toast.error("Session expired. Please sign in again.");
        if (typeof window !== "undefined") window.location.href = "/auth";
        return Promise.reject(error);
      }
    }

    // Normalize error payload
    const apiErr: ApiError = {
      status: error.response?.status ?? 0,
      message:
        error.response?.data?.message ??
        error.message ??
        "Unexpected network error",
      timestamp: new Date().toISOString(),
      path: original?.url,
      errors: error.response?.data?.errors,
    };

    // Non-401 server errors → toast once
    if (apiErr.status >= 500) {
      toast.error(`Server error: ${apiErr.message}`);
    } else if (apiErr.status === 0) {
      toast.error("Network unreachable. Check your connection or backend URL.");
    }

    return Promise.reject(apiErr);
  }
);

/* ─────── Small retry wrapper for critical idempotent GETs ─────── */
export async function getWithRetry<T>(url: string, config?: AxiosRequestConfig, retries = 2): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await api.get<T>(url, config);
      return res.data;
    } catch (e) {
      lastErr = e;
      const status = (e as ApiError).status;
      if (status && status < 500 && status !== 0) break; // don't retry 4xx
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }
  }
  throw lastErr;
}

/* ─────── Mock mode toggle ─────── */
export const USE_MOCKS = String(import.meta.env.VITE_USE_MOCKS ?? "true") === "true";
