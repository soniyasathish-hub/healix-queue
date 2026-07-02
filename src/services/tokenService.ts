/**
 * Token service (queue token issue + lookup + QR).
 *
 * Spring Boot mapping
 *   Controller: TokenController
 *   Service:    TokenService (generates human-readable token numbers)
 *   Repository: QueueTokenRepository
 *   Entity:     QueueToken
 *   DTO:        QueueTokenDto
 *   Table:      queue_tokens
 */
import { api, USE_MOCKS } from "@/lib/api-client";
import type { QueueTokenDto } from "@/types/api";
import { MOCK_TOKENS, delay } from "./mock-data";

export const tokenService = {
  /** GET /api/tokens?patientId=&appointmentId= */
  async list(params?: { patientId?: string; appointmentId?: string }): Promise<QueueTokenDto[]> {
    if (USE_MOCKS) {
      let list = MOCK_TOKENS;
      if (params?.patientId) list = list.filter((t) => t.patientId === params.patientId);
      if (params?.appointmentId) list = list.filter((t) => t.appointmentId === params.appointmentId);
      return delay(list);
    }
    const { data } = await api.get<QueueTokenDto[]>("/tokens", { params });
    return data;
  },

  /** POST /api/tokens — issue a new token for an appointment */
  async issue(appointmentId: string): Promise<QueueTokenDto> {
    if (USE_MOCKS) {
      const token: QueueTokenDto = {
        id: `t_${Date.now()}`,
        tokenNumber: `A-${Math.floor(Math.random() * 999).toString().padStart(3, "0")}`,
        appointmentId,
        patientId: "p_1",
        doctorId: "d_1",
        position: MOCK_TOKENS.length + 1,
        estimatedWaitMinutes: 15,
        status: "WAITING",
        issuedAt: new Date().toISOString(),
      };
      MOCK_TOKENS.push(token);
      return delay(token);
    }
    const { data } = await api.post<QueueTokenDto>("/tokens", { appointmentId });
    return data;
  },
};
