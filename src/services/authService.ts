/**
 * Auth service — talks to Spring Boot AuthController.
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ Spring Boot mapping                                              │
 * │ Controller: AuthController                                       │
 * │ Service:    AuthService (JWT issue, refresh, revoke)             │
 * │ Repository: UserRepository, RefreshTokenRepository               │
 * │ Entity:     User, RefreshToken                                   │
 * │ DTO:        LoginRequest, RegisterRequest, AuthResponse, UserDto │
 * │ Tables:     users, refresh_tokens                                │
 * └──────────────────────────────────────────────────────────────────┘
 */
import { api, tokenStore, USE_MOCKS } from "@/lib/api-client";
import type { AuthResponse, LoginRequest, RegisterRequest, UserDto } from "@/types/api";
import { MOCK_AUTH, MOCK_USER, delay } from "./mock-data";

export const authService = {
  /** POST /api/auth/login */
  async login(payload: LoginRequest): Promise<AuthResponse> {
    if (USE_MOCKS) {
      const res = await delay({ ...MOCK_AUTH, user: { ...MOCK_USER, email: payload.email } });
      tokenStore.set(res);
      tokenStore.setUser(res.user);
      return res;
    }
    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    tokenStore.set(data);
    tokenStore.setUser(data.user);
    return data;
  },

  /** POST /api/auth/register */
  async register(payload: RegisterRequest): Promise<AuthResponse> {
    if (USE_MOCKS) {
      const res = await delay({
        ...MOCK_AUTH,
        user: { ...MOCK_USER, email: payload.email, fullName: payload.fullName, role: payload.role },
      });
      tokenStore.set(res);
      tokenStore.setUser(res.user);
      return res;
    }
    const { data } = await api.post<AuthResponse>("/auth/register", payload);
    tokenStore.set(data);
    tokenStore.setUser(data.user);
    return data;
  },

  /** GET /api/auth/me */
  async me(): Promise<UserDto> {
    if (USE_MOCKS) return delay(tokenStore.getUser<UserDto>() ?? MOCK_USER);
    const { data } = await api.get<UserDto>("/auth/me");
    tokenStore.setUser(data);
    return data;
  },

  /** POST /api/auth/logout */
  async logout(): Promise<void> {
    try {
      if (!USE_MOCKS) await api.post("/auth/logout");
    } finally {
      tokenStore.clear();
    }
  },

  isAuthenticated: () => Boolean(tokenStore.getAccess()),
  currentUser: () => tokenStore.getUser<UserDto>(),
};
