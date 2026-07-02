# QueueLess AI+ 🏥

> Next-generation smart hospital queue, appointment & healthcare intelligence platform.

[![Made with TanStack Start](https://img.shields.io/badge/TanStack-Start-1f6feb)](https://tanstack.com/start)
[![React 19](https://img.shields.io/badge/React-19-61dafb)](https://react.dev)
[![Tailwind v4](https://img.shields.io/badge/Tailwind-v4-38bdf8)](https://tailwindcss.com)
[![Lovable Cloud](https://img.shields.io/badge/Lovable-Cloud-8b5cf6)](https://lovable.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

QueueLess AI+ eliminates hospital waiting rooms by combining intelligent appointment scheduling, digital token queues, AI-powered wait-time prediction, and real-time patient communication in a single SaaS platform.

**Live demo:** https://healix-queue.lovable.app

---

## ✨ Features

### For Patients
- 🔍 Search doctors by specialization, hospital, availability
- 📅 Book appointments in seconds
- 🎫 Digital queue token with QR code
- ⏱️ **AI-predicted waiting time** (Gemini via Lovable AI Gateway)
- 💬 **AI Health Assistant** — symptom triage & department recommendation
- 📄 Upload medical reports + get AI-powered plain-language summaries

### For Doctors
- 📋 Today's live queue with call-next / skip / complete controls
- 👥 Patient history and consultation notes
- 📆 Appointment calendar

### For Receptionists
- ✅ One-tap patient check-in
- 📊 Today's appointments dashboard

### For Admins
- 📈 Analytics: daily patients, peak hours, department distribution (Recharts)
- 👤 User & role management
- 🏥 Doctor & department administration

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start v1 (React 19, SSR) |
| Build | Vite 7 |
| Styling | Tailwind CSS v4 + shadcn/ui + custom design tokens |
| Backend | Lovable Cloud (Postgres + Auth + Storage) |
| AI | Lovable AI Gateway → Google Gemini 3 Flash |
| Charts | Recharts |
| QR | qrcode.react |
| Deployment | Cloudflare Workers (via Lovable) |

---

## 🚀 Quick Start

### Prerequisites
- **Bun** ≥ 1.1 (or Node ≥ 20)
- Lovable Cloud project (auto-provisioned)

### Install & run
```bash
bun install
bun run dev
```

App runs on `http://localhost:8080`.

### Environment variables
`.env` is auto-managed by Lovable Cloud. Do not edit manually.

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Cloud API URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public anon key |
| `LOVABLE_API_KEY` | AI Gateway (server-only) |

---

## 📁 Project Structure

```
src/
├── routes/              # File-based pages (URL = filename)
│   ├── index.tsx        # Landing
│   ├── auth.tsx         # Sign in / up
│   ├── patient.*        # Patient dashboard + child routes
│   ├── doctor.*         # Doctor workspace
│   ├── reception.*      # Reception desk
│   └── admin.*          # Admin console
├── components/
│   ├── AppShell.tsx     # Responsive layout with sidebar + mobile drawer
│   ├── AIChatbot.tsx    # Floating patient AI assistant
│   ├── StatCard.tsx     # Reusable KPI card
│   └── ui/              # shadcn/ui primitives (do not edit)
├── lib/
│   ├── ai.functions.ts  # Server fns: wait prediction, chat, report summary
│   ├── ai-gateway.server.ts
│   ├── auth-context.tsx # AuthProvider + role helpers
│   └── theme.tsx        # Dark/light theme provider
├── integrations/supabase/  # Auto-generated — do not edit
├── styles.css           # Tailwind v4 + design tokens
└── router.tsx           # Router bootstrap

supabase/migrations/     # SQL schema history (append-only)
```

---

## 🗄️ Database Schema (high level)

```
auth.users (managed by Cloud)
   │
   ├── profiles (1:1)
   ├── user_roles (1:N)  ── enum: admin | doctor | receptionist | patient
   │
   ├── doctors ──┐
   │             ├── appointments ── queue_tokens
   └── ...       │
                 └── medical_reports (Storage-linked)
```

All tables use **Row Level Security**. Patients see only their own rows; doctors see their assigned patients; admins see all.

---

## 🤖 AI Architecture

```
Client ──> createServerFn ──> Lovable AI Gateway ──> Gemini 3 Flash
                                    │
                                    └── structured output (Zod schema)
```

Three AI server functions live in `src/lib/ai.functions.ts`:

1. **`predictWaitTime`** — estimates ETA using queue length, doctor efficiency, emergency count, time-of-day.
2. **`chatWithAssistant`** — multi-turn health assistant with a strict system prompt (never diagnoses; triggers emergency guidance on red-flag symptoms).
3. **`summarizeReport`** — plain-language orientation for uploaded medical reports.

Fallbacks are statistical, so the app remains functional if AI is unavailable.

---

## 🔐 Security Highlights

- **Row Level Security** on every table
- **Roles stored separately** in `user_roles` — prevents privilege escalation
- **Security-definer `has_role()` function** — avoids RLS recursion
- **No secrets in client bundle** — server functions read `process.env` inside `.handler()`
- **Zod validation** on every server function input

---

## 🌿 Git Workflow

```
main         ← production (protected)
develop      ← integration
feature/*    ← new work
hotfix/*     ← urgent prod fixes
release/*    ← version stabilization
```

Recommended daily flow:
```bash
git checkout develop && git pull
git checkout -b feature/notifications
# ... build ...
git add . && git commit -m "feat(notifications): add email service"
git push -u origin feature/notifications
# open PR → review → squash-merge → delete branch
```

---

## 🚢 Deployment

Deployed on **Cloudflare Workers** via Lovable. Click **Publish** in the Lovable editor.

Checklist:
- [ ] All migrations applied
- [ ] RLS policies verified
- [ ] Test accounts seeded for each role
- [ ] AI key set (`LOVABLE_API_KEY`)
- [ ] Custom domain configured
- [ ] Storage bucket permissions reviewed

---

## 📚 Documentation

- [Architecture Diagram](docs/architecture.md)
- [Database ER Diagram](docs/erd.md)
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Testing Guide](docs/testing.md)

---

## 🗺️ Roadmap

- [x] Core scheduling & queue
- [x] AI wait prediction + chatbot + report summary
- [x] Dark mode + mobile nav
- [ ] Real-time notifications (email + push)
- [ ] Nurse / Lab / Pharmacy modules
- [ ] Multi-hospital tenancy
- [ ] Telemedicine (video consult)
- [ ] Mobile apps (React Native)

---

## 📄 License

MIT © 2026 QueueLess AI+
