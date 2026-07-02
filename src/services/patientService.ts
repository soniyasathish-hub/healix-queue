/**
 * Patient service.
 *
 * Spring Boot mapping
 *   Controller: PatientController
 *   Service:    PatientService
 *   Repository: PatientRepository
 *   Entity:     Patient
 *   DTO:        PatientDto
 *   Table:      patients
 */
import { api, USE_MOCKS } from "@/lib/api-client";
import type { PatientDto } from "@/types/api";
import { MOCK_PATIENTS, delay } from "./mock-data";

export const patientService = {
  /** GET /api/patients */
  async list(): Promise<PatientDto[]> {
    if (USE_MOCKS) return delay(MOCK_PATIENTS);
    const { data } = await api.get<PatientDto[]>("/patients");
    return data;
  },

  /** GET /api/patients/{id} */
  async get(id: string): Promise<PatientDto> {
    if (USE_MOCKS) {
      const p = MOCK_PATIENTS.find((x) => x.id === id);
      if (!p) throw new Error("Patient not found");
      return delay(p);
    }
    const { data } = await api.get<PatientDto>(`/patients/${id}`);
    return data;
  },

  /** POST /api/patients */
  async create(payload: Omit<PatientDto, "id">): Promise<PatientDto> {
    if (USE_MOCKS) {
      const created: PatientDto = { id: `p_${Date.now()}`, ...payload };
      MOCK_PATIENTS.push(created);
      return delay(created);
    }
    const { data } = await api.post<PatientDto>("/patients", payload);
    return data;
  },
};
