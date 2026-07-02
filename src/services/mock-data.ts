/**
 * Realistic mock data used when VITE_USE_MOCKS=true.
 * Delete this file (and the isMock branches) once Spring Boot is live.
 */
import type {
  AdminDashboardDto,
  AppointmentDto,
  AuthResponse,
  DoctorDashboardDto,
  DoctorDto,
  LiveQueueDto,
  MedicalReportDto,
  NotificationDto,
  PatientDashboardDto,
  PatientDto,
  QueueTokenDto,
} from "@/types/api";

export const MOCK_USER = {
  id: "u_1",
  email: "patient@demo.com",
  fullName: "Alex Morgan",
  role: "PATIENT" as const,
  phone: "+1 555 0101",
  createdAt: new Date().toISOString(),
};

export const MOCK_AUTH: AuthResponse = {
  accessToken: "mock.jwt.access.token",
  refreshToken: "mock.jwt.refresh.token",
  expiresIn: 3600,
  user: MOCK_USER,
};

export const MOCK_DOCTORS: DoctorDto[] = [
  { id: "d_1", fullName: "Dr. Sarah Chen", specialization: "Cardiology", department: "Cardiology", yearsOfExperience: 12, avgConsultationMinutes: 15, rating: 4.8, availableToday: true },
  { id: "d_2", fullName: "Dr. Rajiv Patel", specialization: "Neurology", department: "Neurology", yearsOfExperience: 18, avgConsultationMinutes: 20, rating: 4.9, availableToday: true },
  { id: "d_3", fullName: "Dr. Emily Watson", specialization: "Pediatrics", department: "Pediatrics", yearsOfExperience: 8, avgConsultationMinutes: 12, rating: 4.7, availableToday: true },
  { id: "d_4", fullName: "Dr. Ahmed Hassan", specialization: "Orthopedics", department: "Orthopedics", yearsOfExperience: 15, avgConsultationMinutes: 18, rating: 4.6, availableToday: false },
  { id: "d_5", fullName: "Dr. Priya Sharma", specialization: "Dermatology", department: "Dermatology", yearsOfExperience: 10, avgConsultationMinutes: 10, rating: 4.8, availableToday: true },
];

export const MOCK_PATIENTS: PatientDto[] = [
  { id: "p_1", fullName: "Alex Morgan", email: "alex@demo.com", phone: "+1 555 0101", gender: "MALE", bloodGroup: "O+" },
  { id: "p_2", fullName: "Nina Rossi", email: "nina@demo.com", phone: "+1 555 0102", gender: "FEMALE", bloodGroup: "A+" },
  { id: "p_3", fullName: "Kenji Ito", email: "kenji@demo.com", phone: "+1 555 0103", gender: "MALE", bloodGroup: "B-" },
];

export const MOCK_APPOINTMENTS: AppointmentDto[] = [
  { id: "a_1", patientId: "p_1", patientName: "Alex Morgan", doctorId: "d_1", doctorName: "Dr. Sarah Chen", department: "Cardiology", scheduledAt: new Date(Date.now() + 3600_000).toISOString(), status: "SCHEDULED", reason: "Chest checkup", isEmergency: false },
  { id: "a_2", patientId: "p_2", patientName: "Nina Rossi", doctorId: "d_2", doctorName: "Dr. Rajiv Patel", department: "Neurology", scheduledAt: new Date(Date.now() + 7200_000).toISOString(), status: "CHECKED_IN", reason: "Migraine follow-up", isEmergency: false },
  { id: "a_3", patientId: "p_3", patientName: "Kenji Ito", doctorId: "d_3", doctorName: "Dr. Emily Watson", department: "Pediatrics", scheduledAt: new Date(Date.now() + 10800_000).toISOString(), status: "SCHEDULED", reason: "Annual review", isEmergency: false },
];

export const MOCK_TOKENS: QueueTokenDto[] = [
  { id: "t_1", tokenNumber: "A-014", appointmentId: "a_1", patientId: "p_1", doctorId: "d_1", position: 3, estimatedWaitMinutes: 22, status: "WAITING", issuedAt: new Date().toISOString() },
];

export const MOCK_LIVE_QUEUE: LiveQueueDto = {
  doctorId: "d_1",
  doctorName: "Dr. Sarah Chen",
  department: "Cardiology",
  currentToken: "A-011",
  tokens: MOCK_TOKENS,
  totalWaiting: 3,
  avgWaitMinutes: 18,
};

export const MOCK_REPORTS: MedicalReportDto[] = [
  { id: "r_1", patientId: "p_1", title: "Blood Panel — Q1 2026", fileUrl: "https://example.com/report.pdf", fileType: "application/pdf", uploadedAt: new Date().toISOString() },
];

export const MOCK_NOTIFICATIONS: NotificationDto[] = [
  { id: "n_1", title: "Appointment confirmed", body: "Your Cardiology appointment is tomorrow at 10:30 AM.", type: "APPOINTMENT", read: false, createdAt: new Date().toISOString() },
  { id: "n_2", title: "Your turn soon", body: "Token A-014 — approximately 22 minutes.", type: "QUEUE", read: false, createdAt: new Date().toISOString() },
];

export const MOCK_ADMIN_DASHBOARD: AdminDashboardDto = {
  totalPatients: 1284,
  totalDoctors: 42,
  todayAppointments: 187,
  avgWaitMinutes: 14,
  dailyPatients: Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 86400_000).toISOString().slice(0, 10),
    count: 120 + Math.round(Math.random() * 80),
  })),
  peakHours: Array.from({ length: 12 }, (_, i) => ({ hour: 8 + i, count: Math.round(20 + Math.random() * 60) })),
  departmentDistribution: [
    { department: "Cardiology", count: 320 },
    { department: "Neurology", count: 210 },
    { department: "Pediatrics", count: 280 },
    { department: "Orthopedics", count: 190 },
    { department: "Dermatology", count: 284 },
  ],
};

export const MOCK_DOCTOR_DASHBOARD: DoctorDashboardDto = {
  todayQueue: 12,
  completedToday: 7,
  upcomingAppointments: 5,
  avgConsultationMinutes: 15,
  nextPatient: MOCK_TOKENS[0],
};

export const MOCK_PATIENT_DASHBOARD: PatientDashboardDto = {
  upcomingAppointments: MOCK_APPOINTMENTS.slice(0, 2),
  activeToken: MOCK_TOKENS[0],
  recentReports: MOCK_REPORTS,
};

export const delay = <T>(data: T, ms = 300): Promise<T> =>
  new Promise((r) => setTimeout(() => r(data), ms));
