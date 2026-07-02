/**
 * Dashboard service — role-specific aggregated views.
 *
 * Spring Boot mapping
 *   Controller: DashboardController
 *   Service:    DashboardService (aggregates from multiple repositories)
 *   Repository: AppointmentRepository, PatientRepository, DoctorRepository,
 *               QueueTokenRepository, MedicalReportRepository
 *   DTO:        AdminDashboardDto, DoctorDashboardDto, PatientDashboardDto
 *   Tables:     appointments, patients, doctors, queue_tokens, medical_reports
 */
import { api, USE_MOCKS } from "@/lib/api-client";
import type {
  AdminDashboardDto,
  DoctorDashboardDto,
  PatientDashboardDto,
} from "@/types/api";
import {
  MOCK_ADMIN_DASHBOARD,
  MOCK_DOCTOR_DASHBOARD,
  MOCK_PATIENT_DASHBOARD,
  delay,
} from "./mock-data";

export const dashboardService = {
  /** GET /api/dashboard/admin */
  async admin(): Promise<AdminDashboardDto> {
    if (USE_MOCKS) return delay(MOCK_ADMIN_DASHBOARD);
    const { data } = await api.get<AdminDashboardDto>("/dashboard/admin");
    return data;
  },

  /** GET /api/dashboard/doctor */
  async doctor(): Promise<DoctorDashboardDto> {
    if (USE_MOCKS) return delay(MOCK_DOCTOR_DASHBOARD);
    const { data } = await api.get<DoctorDashboardDto>("/dashboard/doctor");
    return data;
  },

  /** GET /api/dashboard/patient */
  async patient(): Promise<PatientDashboardDto> {
    if (USE_MOCKS) return delay(MOCK_PATIENT_DASHBOARD);
    const { data } = await api.get<PatientDashboardDto>("/dashboard/patient");
    return data;
  },
};
