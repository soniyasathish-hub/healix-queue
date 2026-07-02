/**
 * Doctor service.
 *
 * Spring Boot mapping
 *   Controller: DoctorController
 *   Service:    DoctorService
 *   Repository: DoctorRepository
 *   Entity:     Doctor
 *   DTO:        DoctorDto, DoctorCreateRequest
 *   Table:      doctors
 */
import { api, USE_MOCKS } from "@/lib/api-client";
import type { DoctorCreateRequest, DoctorDto } from "@/types/api";
import { MOCK_DOCTORS, delay } from "./mock-data";

export const doctorService = {
  /** GET /api/doctors */
  async list(query?: { department?: string; search?: string }): Promise<DoctorDto[]> {
    if (USE_MOCKS) {
      let list = MOCK_DOCTORS;
      if (query?.department) list = list.filter((d) => d.department === query.department);
      if (query?.search) {
        const q = query.search.toLowerCase();
        list = list.filter((d) => d.fullName.toLowerCase().includes(q) || d.specialization.toLowerCase().includes(q));
      }
      return delay(list);
    }
    const { data } = await api.get<DoctorDto[]>("/doctors", { params: query });
    return data;
  },

  /** GET /api/doctors/{id} */
  async get(id: string): Promise<DoctorDto> {
    if (USE_MOCKS) {
      const d = MOCK_DOCTORS.find((x) => x.id === id);
      if (!d) throw new Error("Doctor not found");
      return delay(d);
    }
    const { data } = await api.get<DoctorDto>(`/doctors/${id}`);
    return data;
  },

  /** POST /api/doctors */
  async create(payload: DoctorCreateRequest): Promise<DoctorDto> {
    if (USE_MOCKS) {
      const created: DoctorDto = { id: `d_${Date.now()}`, rating: 5, availableToday: true, ...payload };
      MOCK_DOCTORS.push(created);
      return delay(created);
    }
    const { data } = await api.post<DoctorDto>("/doctors", payload);
    return data;
  },

  /** PUT /api/doctors/{id} */
  async update(id: string, payload: Partial<DoctorCreateRequest>): Promise<DoctorDto> {
    if (USE_MOCKS) {
      const idx = MOCK_DOCTORS.findIndex((x) => x.id === id);
      if (idx < 0) throw new Error("Doctor not found");
      MOCK_DOCTORS[idx] = { ...MOCK_DOCTORS[idx], ...payload };
      return delay(MOCK_DOCTORS[idx]);
    }
    const { data } = await api.put<DoctorDto>(`/doctors/${id}`, payload);
    return data;
  },

  /** DELETE /api/doctors/{id} */
  async remove(id: string): Promise<void> {
    if (USE_MOCKS) {
      const idx = MOCK_DOCTORS.findIndex((x) => x.id === id);
      if (idx >= 0) MOCK_DOCTORS.splice(idx, 1);
      return delay(undefined);
    }
    await api.delete(`/doctors/${id}`);
  },
};
