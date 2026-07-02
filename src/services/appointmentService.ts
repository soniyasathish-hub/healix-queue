/**
 * Appointment service.
 *
 * Spring Boot mapping
 *   Controller: AppointmentController
 *   Service:    AppointmentService (validates slot, triggers QueueService)
 *   Repository: AppointmentRepository
 *   Entity:     Appointment
 *   DTO:        AppointmentDto, AppointmentCreateRequest
 *   Table:      appointments
 */
import { api, USE_MOCKS } from "@/lib/api-client";
import type { AppointmentCreateRequest, AppointmentDto, AppointmentStatus } from "@/types/api";
import { MOCK_APPOINTMENTS, MOCK_DOCTORS, MOCK_PATIENTS, delay } from "./mock-data";

export const appointmentService = {
  /** GET /api/appointments?patientId=&doctorId=&status= */
  async list(params?: { patientId?: string; doctorId?: string; status?: AppointmentStatus }): Promise<AppointmentDto[]> {
    if (USE_MOCKS) {
      let list = MOCK_APPOINTMENTS;
      if (params?.patientId) list = list.filter((a) => a.patientId === params.patientId);
      if (params?.doctorId) list = list.filter((a) => a.doctorId === params.doctorId);
      if (params?.status) list = list.filter((a) => a.status === params.status);
      return delay(list);
    }
    const { data } = await api.get<AppointmentDto[]>("/appointments", { params });
    return data;
  },

  /** POST /api/appointments */
  async create(payload: AppointmentCreateRequest): Promise<AppointmentDto> {
    if (USE_MOCKS) {
      const doc = MOCK_DOCTORS.find((d) => d.id === payload.doctorId);
      const pat = MOCK_PATIENTS.find((p) => p.id === payload.patientId);
      const created: AppointmentDto = {
        id: `a_${Date.now()}`,
        patientId: payload.patientId,
        patientName: pat?.fullName ?? "Unknown",
        doctorId: payload.doctorId,
        doctorName: doc?.fullName ?? "Unknown",
        department: doc?.department ?? "General",
        scheduledAt: payload.scheduledAt,
        reason: payload.reason,
        isEmergency: payload.isEmergency ?? false,
        status: "SCHEDULED",
      };
      MOCK_APPOINTMENTS.push(created);
      return delay(created);
    }
    const { data } = await api.post<AppointmentDto>("/appointments", payload);
    return data;
  },

  /** PUT /api/appointments/{id} */
  async update(id: string, payload: Partial<AppointmentDto>): Promise<AppointmentDto> {
    if (USE_MOCKS) {
      const idx = MOCK_APPOINTMENTS.findIndex((a) => a.id === id);
      if (idx < 0) throw new Error("Appointment not found");
      MOCK_APPOINTMENTS[idx] = { ...MOCK_APPOINTMENTS[idx], ...payload };
      return delay(MOCK_APPOINTMENTS[idx]);
    }
    const { data } = await api.put<AppointmentDto>(`/appointments/${id}`, payload);
    return data;
  },

  /** DELETE /api/appointments/{id} */
  async cancel(id: string): Promise<void> {
    if (USE_MOCKS) {
      const idx = MOCK_APPOINTMENTS.findIndex((a) => a.id === id);
      if (idx >= 0) MOCK_APPOINTMENTS[idx].status = "CANCELLED";
      return delay(undefined);
    }
    await api.delete(`/appointments/${id}`);
  },
};
