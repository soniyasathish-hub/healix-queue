/**
 * Notification + feedback service.
 *
 * Spring Boot mapping
 *   Controller: NotificationController, FeedbackController
 *   Service:    NotificationService (email + WebSocket push), FeedbackService
 *   Repository: NotificationRepository, FeedbackRepository
 *   Entity:     Notification, Feedback
 *   DTO:        NotificationDto, FeedbackRequest
 *   Tables:     notifications, feedback
 */
import { api, USE_MOCKS } from "@/lib/api-client";
import type { FeedbackRequest, NotificationDto } from "@/types/api";
import { MOCK_NOTIFICATIONS, delay } from "./mock-data";

export const notificationService = {
  /** GET /api/notifications */
  async list(): Promise<NotificationDto[]> {
    if (USE_MOCKS) return delay(MOCK_NOTIFICATIONS);
    const { data } = await api.get<NotificationDto[]>("/notifications");
    return data;
  },

  /** POST /api/notifications/{id}/read */
  async markRead(id: string): Promise<void> {
    if (USE_MOCKS) {
      const n = MOCK_NOTIFICATIONS.find((x) => x.id === id);
      if (n) n.read = true;
      return delay(undefined);
    }
    await api.post(`/notifications/${id}/read`);
  },

  /** POST /api/feedback */
  async submitFeedback(payload: FeedbackRequest): Promise<void> {
    if (USE_MOCKS) return delay(undefined);
    await api.post("/feedback", payload);
  },
};
