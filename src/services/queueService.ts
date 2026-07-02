/**
 * Queue service (real-time waiting list).
 *
 * Spring Boot mapping
 *   Controller: QueueController
 *   Service:    QueueService (position calc, ETA, WebSocket broadcast)
 *   Repository: QueueTokenRepository
 *   Entity:     QueueToken
 *   DTO:        QueueTokenDto, LiveQueueDto
 *   Table:      queue_tokens
 *   Realtime:   /ws/queue (STOMP topic /topic/queue.{doctorId})
 */
import { api, USE_MOCKS } from "@/lib/api-client";
import type { LiveQueueDto, QueueTokenDto } from "@/types/api";
import { MOCK_LIVE_QUEUE, MOCK_TOKENS, delay } from "./mock-data";

export const queueService = {
  /** GET /api/queue/live?doctorId= */
  async live(doctorId: string): Promise<LiveQueueDto> {
    if (USE_MOCKS) return delay({ ...MOCK_LIVE_QUEUE, doctorId });
    const { data } = await api.get<LiveQueueDto>("/queue/live", { params: { doctorId } });
    return data;
  },

  /** POST /api/queue/{doctorId}/next — doctor calls next patient */
  async callNext(doctorId: string): Promise<QueueTokenDto | null> {
    if (USE_MOCKS) return delay(MOCK_TOKENS[0] ?? null);
    const { data } = await api.post<QueueTokenDto | null>(`/queue/${doctorId}/next`);
    return data;
  },

  /** POST /api/queue/{tokenId}/skip */
  async skip(tokenId: string): Promise<void> {
    if (USE_MOCKS) return delay(undefined);
    await api.post(`/queue/${tokenId}/skip`);
  },

  /** POST /api/queue/{tokenId}/complete */
  async complete(tokenId: string): Promise<void> {
    if (USE_MOCKS) return delay(undefined);
    await api.post(`/queue/${tokenId}/complete`);
  },
};
