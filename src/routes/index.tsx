import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth, pickHomePath } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Activity, Sparkles, Clock, Users, ShieldCheck, QrCode, Brain,
  ArrowRight, CheckCircle2, Stethoscope, ListOrdered, TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QueueLess AI — Smart Hospital Queue & Appointments" },
      { name: "description", content: "AI-powered hospital queue management, digital tokens, and real-time waiting time prediction. Cut hospital wait times by 70%." },
      { property: "og:title", content: "QueueLess AI — Smart Hospital Queue" },
      { property: "og:description", content: "AI-powered hospital queue management with real-time waiting time prediction." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const home = pickHomePath(roles);

  useEffect(() => { /* preconnect */ }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* NAV */}
      <header className="fixed top-0 inset-x-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Activity className="size-5 text-white" />
            </div>
            <div>
              <div className="font-display font-bold leading-tight">QueueLess</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">AI Hospital</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition">Features</a>
            <a href="#how" className="text-muted-foreground hover:text-foreground transition">How it works</a>
            <a href="#stats" className="text-muted-foreground hover:text-foreground transition">Impact</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Button onClick={() => navigate({ to: home })} className="gradient-primary text-primary-foreground">
                Open dashboard <ArrowRight className="size-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate({ to: "/auth" })}>Sign in</Button>
                <Button onClick={() => navigate({ to: "/auth" })} className="gradient-primary text-primary-foreground">
                  Get started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative pt-32 pb-24 bg-grid">
        <div className="absolute inset-x-0 top-0 h-[600px] gradient-hero opacity-10 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium text-primary border border-primary/20">
              <Sparkles className="size-3.5" />
              AI-powered queue intelligence
            </div>
            <h1 className="mt-6 text-5xl md:text-6xl font-display font-bold tracking-tight leading-[1.05]">
              Cut hospital wait times by{" "}
              <span className="text-gradient">up to 70%</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              QueueLess AI replaces paper tokens and endless waiting rooms with smart appointments,
              live queue tracking, QR check-in and AI-predicted waiting times — for patients, doctors,
              receptionists and admins.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate({ to: user ? home : "/auth" })} className="gradient-primary text-primary-foreground shadow-elegant-lg">
                {user ? "Open dashboard" : "Start free trial"} <ArrowRight className="size-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
                Explore features
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-success" /> HIPAA-aware</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-success" /> Real-time</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-success" /> Multi-role</div>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative">
            <div className="absolute -inset-8 gradient-hero opacity-20 rounded-[3rem] blur-3xl" />
            <div className="relative glass-card rounded-3xl p-6 animate-float">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Live Queue · Cardiology</div>
                  <div className="font-display font-bold text-lg mt-1">Dr. Aisha Khan</div>
                </div>
                <div className="size-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold animate-pulse-glow">
                  A14
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="text-xs text-muted-foreground">Now serving</div>
                  <div className="text-2xl font-display font-bold mt-1">A11</div>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="text-xs text-muted-foreground">Your position</div>
                  <div className="text-2xl font-display font-bold mt-1">3rd</div>
                </div>
              </div>
              <div className="mt-4 p-4 rounded-xl gradient-primary text-primary-foreground">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-90">
                  <Brain className="size-3.5" /> AI Prediction
                </div>
                <div className="mt-1 flex items-end gap-2">
                  <div className="text-4xl font-display font-bold">18</div>
                  <div className="text-sm opacity-90 mb-1">min wait · 94% confidence</div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {[
                  { t: "A12", n: "Priya M.", st: "In consultation" },
                  { t: "A13", n: "Ravi S.", st: "Next" },
                  { t: "A14", n: "You", st: "Waiting" },
                ].map((r, i) => (
                  <div key={r.t} className={`flex items-center justify-between p-3 rounded-lg ${i === 2 ? "bg-primary/10 border border-primary/20" : "bg-muted/50"}`}>
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-card flex items-center justify-center text-xs font-bold">{r.t}</div>
                      <div className="text-sm font-medium">{r.n}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{r.st}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section id="stats" className="py-12 border-y border-border/50 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { v: "70%", l: "Less waiting time" },
            { v: "94%", l: "AI prediction accuracy" },
            { v: "50+", l: "Hospitals onboard" },
            { v: "2M+", l: "Tokens issued" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className="text-4xl font-display font-bold text-gradient">{s.v}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-4xl font-display font-bold tracking-tight">Everything a modern hospital needs</h2>
            <p className="mt-3 text-muted-foreground">Four role-aware dashboards working in real time, powered by AI.</p>
          </div>
          <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { i: Brain, t: "AI Wait-Time Prediction", d: "Realistic ETA per patient using queue length, emergencies and historical patterns." },
              { i: QrCode, t: "Digital Tokens & QR Check-In", d: "Generate a token instantly, scan to check in — no paper, no friction." },
              { i: ListOrdered, t: "Live Queue Tracking", d: "Patients see their position update in real time. Doctors call next with one tap." },
              { i: Stethoscope, t: "Smart Appointments", d: "Search by specialization, pick a slot, reschedule or cancel anytime." },
              { i: ShieldCheck, t: "Role-Based Access", d: "Patient, Doctor, Receptionist, Admin — each sees only what they should." },
              { i: TrendingUp, t: "Analytics Dashboard", d: "Daily patients, revenue, peak hours, doctor performance, satisfaction." },
            ].map((f) => (
              <div key={f.t} className="glass-card rounded-2xl p-6 hover:shadow-elegant-lg transition-all group">
                <div className="size-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow group-hover:scale-110 transition">
                  <f.i className="size-5 text-primary-foreground" />
                </div>
                <h3 className="mt-5 font-display font-semibold text-lg">{f.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="py-24 gradient-soft">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-4xl font-display font-bold tracking-tight">From walk-in to discharge in clicks</h2>
          </div>
          <div className="mt-14 grid md:grid-cols-4 gap-6">
            {[
              { n: "01", t: "Book", d: "Patient picks doctor and slot online.", i: Stethoscope },
              { n: "02", t: "Check in", d: "Scan QR at reception or self-check.", i: QrCode },
              { n: "03", t: "Wait smart", d: "AI shows live ETA — no more guessing.", i: Clock },
              { n: "04", t: "Consult", d: "Doctor calls next, uploads Rx.", i: Users },
            ].map((s) => (
              <div key={s.n} className="relative glass-card rounded-2xl p-6">
                <div className="text-xs font-display font-bold text-primary">{s.n}</div>
                <s.i className="size-8 text-primary mt-3" />
                <div className="mt-3 font-display font-semibold">{s.t}</div>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="rounded-3xl gradient-hero p-12 text-center shadow-elegant-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-20" />
            <div className="relative">
              <h2 className="text-4xl font-display font-bold text-white tracking-tight">Ready to end the waiting room?</h2>
              <p className="mt-3 text-white/80 max-w-lg mx-auto">Join hospitals using QueueLess AI to deliver faster, calmer, more dignified care.</p>
              <Button size="lg" onClick={() => navigate({ to: user ? home : "/auth" })} className="mt-7 bg-white text-primary hover:bg-white/90">
                {user ? "Open dashboard" : "Get started free"} <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} QueueLess AI · Smart Hospital Queue & Appointments
      </footer>
    </div>
  );
}
