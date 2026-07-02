/**
 * TypeScript interfaces mirroring Spring Boot DTOs.
 * Keep field names in snake_case ↔ camelCase aligned with your @JsonProperty settings.
 * When a Java record/DTO changes, update the matching interface here.
 */

/* ─────────────── Auth ─────────────── */
export type Role = "ADMIN" | "DOCTOR" | "RECEPTIONIST" | "PATIENT";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  phone?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  user: UserDto;
}

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
}

/* ─────────────── Doctor ─────────────── */
export interface DoctorDto {
  id: string;
  fullName: string;
  specialization: string;
  department: string;
  yearsOfExperience: number;
  avgConsultationMinutes: number;
  rating: number;
  photoUrl?: string;
  availableToday: boolean;
  hospitalId?: string;
}

export interface DoctorCreateRequest {
  fullName: string;
  specialization: string;
  department: string;
  yearsOfExperience: number;
  avgConsultationMinutes: number;
}

/* ─────────────── Patient ─────────────── */
export interface PatientDto {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  bloodGroup?: string;
  address?: string;
}

/* ─────────────── Appointment ─────────────── */
export type AppointmentStatus =
  | "SCHEDULED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface AppointmentDto {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  scheduledAt: string; // ISO
  status: AppointmentStatus;
  reason?: string;
  isEmergency: boolean;
}

export interface AppointmentCreateRequest {
  patientId: string;
  doctorId: string;
  scheduledAt: string;
  reason?: string;
  isEmergency?: boolean;
}

/* ─────────────── Queue Token ─────────────── */
export interface QueueTokenDto {
  id: string;
  tokenNumber: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  position: number;
  estimatedWaitMinutes: number;
  status: "WAITING" | "CALLED" | "IN_CONSULTATION" | "DONE" | "SKIPPED";
  issuedAt: string;
}

export interface LiveQueueDto {
  doctorId: string;
  doctorName: string;
  department: string;
  currentToken?: string;
  tokens: QueueTokenDto[];
  totalWaiting: number;
  avgWaitMinutes: number;
}

/* ─────────────── Reports ─────────────── */
export interface MedicalReportDto {
  id: string;
  patientId: string;
  title: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
  aiSummary?: string;
}

/* ─────────────── Dashboards ─────────────── */
export interface AdminDashboardDto {
  totalPatients: number;
  totalDoctors: number;
  todayAppointments: number;
  avgWaitMinutes: number;
  dailyPatients: Array<{ date: string; count: number }>;
  peakHours: Array<{ hour: number; count: number }>;
  departmentDistribution: Array<{ department: string; count: number }>;
}

export interface DoctorDashboardDto {
  todayQueue: number;
  completedToday: number;
  upcomingAppointments: number;
  avgConsultationMinutes: number;
  nextPatient?: QueueTokenDto;
}

export interface PatientDashboardDto {
  upcomingAppointments: AppointmentDto[];
  activeToken?: QueueTokenDto;
  recentReports: MedicalReportDto[];
}

/* ─────────────── Notifications & Feedback ─────────────── */
export interface NotificationDto {
  id: string;
  title: string;
  body: string;
  type: "APPOINTMENT" | "QUEUE" | "SYSTEM" | "REPORT";
  read: boolean;
  createdAt: string;
}

export interface FeedbackRequest {
  appointmentId: string;
  rating: number; // 1-5
  comment?: string;
}

/* ─────────────── Generic API envelope ─────────────── */
export interface ApiError {
  status: number;
  message: string;
  timestamp: string;
  path?: string;
  errors?: Record<string, string>;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
