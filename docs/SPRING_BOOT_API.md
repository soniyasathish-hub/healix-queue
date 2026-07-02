# Spring Boot Backend — API Contract & Layer Mapping

This document is the **single source of truth** for wiring the React frontend to a Java Spring Boot backend. Every REST call the frontend makes is listed here alongside the Java layers that should implement it.

---

## 1. Base configuration

| Frontend variable | Value example |
|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080/api` |
| `VITE_USE_MOCKS` | `false` (once backend is live) |
| `VITE_API_TIMEOUT` | `15000` |

**CORS on Spring Boot** must allow the frontend origin:
```java
@Bean
CorsConfigurationSource corsConfigurationSource() {
  CorsConfiguration cfg = new CorsConfiguration();
  cfg.setAllowedOrigins(List.of("http://localhost:8080", "https://healix-queue.lovable.app"));
  cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
  cfg.setAllowedHeaders(List.of("*"));
  cfg.setAllowCredentials(true);
  UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
  src.registerCorsConfiguration("/api/**", cfg);
  return src;
}
```

---

## 2. Authentication (JWT)

| Method | Path | Controller | Service | Repository | Entity | DTO | Table |
|---|---|---|---|---|---|---|---|
| POST | `/auth/login` | `AuthController` | `AuthService` | `UserRepository` | `User` | `LoginRequest → AuthResponse` | `users` |
| POST | `/auth/register` | `AuthController` | `AuthService` | `UserRepository` | `User` | `RegisterRequest → AuthResponse` | `users` |
| POST | `/auth/refresh` | `AuthController` | `AuthService` | `RefreshTokenRepository` | `RefreshToken` | `{refreshToken} → AuthResponse` | `refresh_tokens` |
| GET | `/auth/me` | `AuthController` | `AuthService` | `UserRepository` | `User` | `→ UserDto` | `users` |
| POST | `/auth/logout` | `AuthController` | `AuthService` | `RefreshTokenRepository` | `RefreshToken` | `→ 204` | `refresh_tokens` |

Frontend attaches `Authorization: Bearer <accessToken>` automatically via Axios interceptor.
On `401` the interceptor calls `/auth/refresh` once; on failure it clears storage and redirects to `/auth`.

---

## 3. Doctors

| Method | Path | Controller | Service | Repository | Entity | DTO | Table |
|---|---|---|---|---|---|---|---|
| GET | `/doctors` | `DoctorController` | `DoctorService` | `DoctorRepository` | `Doctor` | `→ List<DoctorDto>` | `doctors` |
| GET | `/doctors/{id}` | `DoctorController` | `DoctorService` | `DoctorRepository` | `Doctor` | `→ DoctorDto` | `doctors` |
| POST | `/doctors` | `DoctorController` | `DoctorService` | `DoctorRepository` | `Doctor` | `DoctorCreateRequest → DoctorDto` | `doctors` |
| PUT | `/doctors/{id}` | `DoctorController` | `DoctorService` | `DoctorRepository` | `Doctor` | `DoctorCreateRequest → DoctorDto` | `doctors` |
| DELETE | `/doctors/{id}` | `DoctorController` | `DoctorService` | `DoctorRepository` | `Doctor` | `→ 204` | `doctors` |

---

## 4. Patients

| Method | Path | Controller | Service | Repository | Entity | DTO | Table |
|---|---|---|---|---|---|---|---|
| GET | `/patients` | `PatientController` | `PatientService` | `PatientRepository` | `Patient` | `→ List<PatientDto>` | `patients` |
| GET | `/patients/{id}` | `PatientController` | `PatientService` | `PatientRepository` | `Patient` | `→ PatientDto` | `patients` |
| POST | `/patients` | `PatientController` | `PatientService` | `PatientRepository` | `Patient` | `PatientDto → PatientDto` | `patients` |

---

## 5. Appointments

| Method | Path | Controller | Service | Repository | Entity | DTO | Table |
|---|---|---|---|---|---|---|---|
| GET | `/appointments` | `AppointmentController` | `AppointmentService` | `AppointmentRepository` | `Appointment` | `→ List<AppointmentDto>` | `appointments` |
| POST | `/appointments` | `AppointmentController` | `AppointmentService` | `AppointmentRepository` | `Appointment` | `AppointmentCreateRequest → AppointmentDto` | `appointments` |
| PUT | `/appointments/{id}` | `AppointmentController` | `AppointmentService` | `AppointmentRepository` | `Appointment` | `AppointmentDto → AppointmentDto` | `appointments` |
| DELETE | `/appointments/{id}` | `AppointmentController` | `AppointmentService` | `AppointmentRepository` | `Appointment` | `→ 204` | `appointments` |

`AppointmentService.create()` should also call `TokenService.issue()` when the appointment is created for today.

---

## 6. Queue & Tokens

| Method | Path | Controller | Service | Repository | Entity | DTO | Table |
|---|---|---|---|---|---|---|---|
| GET | `/queue/live?doctorId=` | `QueueController` | `QueueService` | `QueueTokenRepository` | `QueueToken` | `→ LiveQueueDto` | `queue_tokens` |
| POST | `/queue/{doctorId}/next` | `QueueController` | `QueueService` | `QueueTokenRepository` | `QueueToken` | `→ QueueTokenDto` | `queue_tokens` |
| POST | `/queue/{tokenId}/skip` | `QueueController` | `QueueService` | `QueueTokenRepository` | `QueueToken` | `→ 204` | `queue_tokens` |
| POST | `/queue/{tokenId}/complete` | `QueueController` | `QueueService` | `QueueTokenRepository` | `QueueToken` | `→ 204` | `queue_tokens` |
| GET | `/tokens?patientId=` | `TokenController` | `TokenService` | `QueueTokenRepository` | `QueueToken` | `→ List<QueueTokenDto>` | `queue_tokens` |
| POST | `/tokens` | `TokenController` | `TokenService` | `QueueTokenRepository` | `QueueToken` | `{appointmentId} → QueueTokenDto` | `queue_tokens` |

**Realtime (recommended):** expose STOMP over WebSocket at `/ws/queue` and broadcast to `/topic/queue.{doctorId}` on every mutation.

---

## 7. Reports

| Method | Path | Controller | Service | Repository | Entity | DTO | Table |
|---|---|---|---|---|---|---|---|
| POST | `/reports/upload` (multipart) | `ReportController` | `ReportService` | `MedicalReportRepository` | `MedicalReport` | `multipart → MedicalReportDto` | `medical_reports` |
| GET | `/reports/{id}` | `ReportController` | `ReportService` | `MedicalReportRepository` | `MedicalReport` | `→ MedicalReportDto` | `medical_reports` |
| GET | `/reports?patientId=` | `ReportController` | `ReportService` | `MedicalReportRepository` | `MedicalReport` | `→ List<MedicalReportDto>` | `medical_reports` |

Files stored in S3/MinIO. `MedicalReport.fileUrl` holds the pre-signed URL.

---

## 8. Notifications & Feedback

| Method | Path | Controller | Service | Repository | Entity | DTO | Table |
|---|---|---|---|---|---|---|---|
| GET | `/notifications` | `NotificationController` | `NotificationService` | `NotificationRepository` | `Notification` | `→ List<NotificationDto>` | `notifications` |
| POST | `/notifications/{id}/read` | `NotificationController` | `NotificationService` | `NotificationRepository` | `Notification` | `→ 204` | `notifications` |
| POST | `/feedback` | `FeedbackController` | `FeedbackService` | `FeedbackRepository` | `Feedback` | `FeedbackRequest → 201` | `feedback` |

---

## 9. Dashboards

| Method | Path | Controller | Service | Repositories used | DTO |
|---|---|---|---|---|---|
| GET | `/dashboard/admin` | `DashboardController` | `DashboardService` | Appointment, Patient, Doctor, QueueToken | `AdminDashboardDto` |
| GET | `/dashboard/doctor` | `DashboardController` | `DashboardService` | Appointment, QueueToken | `DoctorDashboardDto` |
| GET | `/dashboard/patient` | `DashboardController` | `DashboardService` | Appointment, QueueToken, MedicalReport | `PatientDashboardDto` |

---

## 10. Suggested MySQL schema (summary)

```sql
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(190) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(190) NOT NULL,
  role ENUM('ADMIN','DOCTOR','RECEPTIONIST','PATIENT') NOT NULL,
  phone VARCHAR(30),
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE refresh_tokens (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE doctors (...);
CREATE TABLE patients (...);
CREATE TABLE appointments (...);
CREATE TABLE queue_tokens (...);
CREATE TABLE medical_reports (...);
CREATE TABLE notifications (...);
CREATE TABLE feedback (...);
```

Full DDL can be generated from the JPA `@Entity` classes via `spring.jpa.hibernate.ddl-auto=update` in dev.

---

## 11. Cutover checklist (mock → real)

1. Deploy Spring Boot server (default port `8080`).
2. Set `.env.local`:
   ```
   VITE_API_BASE_URL=http://localhost:8080/api
   VITE_USE_MOCKS=false
   ```
3. Restart the frontend dev server.
4. Verify `/auth/login` returns `AuthResponse`.
5. Delete `src/services/mock-data.ts` and every `if (USE_MOCKS)` branch (optional — safe to leave for demos).
