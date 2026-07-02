/**
 * Medical report service.
 *
 * Spring Boot mapping
 *   Controller: ReportController
 *   Service:    ReportService (S3 / MinIO upload, virus scan, AI summary trigger)
 *   Repository: MedicalReportRepository
 *   Entity:     MedicalReport
 *   DTO:        MedicalReportDto
 *   Table:      medical_reports
 *   Storage:    S3 bucket `patient-reports` OR local /uploads
 */
import { api, USE_MOCKS } from "@/lib/api-client";
import type { MedicalReportDto } from "@/types/api";
import { MOCK_REPORTS, delay } from "./mock-data";

export const reportService = {
  /** GET /api/reports?patientId= */
  async listByPatient(patientId: string): Promise<MedicalReportDto[]> {
    if (USE_MOCKS) return delay(MOCK_REPORTS.filter((r) => r.patientId === patientId));
    const { data } = await api.get<MedicalReportDto[]>("/reports", { params: { patientId } });
    return data;
  },

  /** GET /api/reports/{id} */
  async get(id: string): Promise<MedicalReportDto> {
    if (USE_MOCKS) {
      const r = MOCK_REPORTS.find((x) => x.id === id);
      if (!r) throw new Error("Report not found");
      return delay(r);
    }
    const { data } = await api.get<MedicalReportDto>(`/reports/${id}`);
    return data;
  },

  /** POST /api/reports/upload — multipart/form-data */
  async upload(file: File, title: string, patientId: string): Promise<MedicalReportDto> {
    if (USE_MOCKS) {
      const created: MedicalReportDto = {
        id: `r_${Date.now()}`,
        patientId,
        title,
        fileUrl: URL.createObjectURL(file),
        fileType: file.type,
        uploadedAt: new Date().toISOString(),
      };
      MOCK_REPORTS.push(created);
      return delay(created);
    }
    const form = new FormData();
    form.append("file", file);
    form.append("title", title);
    form.append("patientId", patientId);
    const { data } = await api.post<MedicalReportDto>("/reports/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};
