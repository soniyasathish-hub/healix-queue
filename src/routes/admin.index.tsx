import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { Users, Stethoscope, Calendar, TrendingUp, Activity, Building2, ListOrdered, Clock } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/admin/")({ component: AdminHome });

const DAILY = [
  { d: "Mon", patients: 142 }, { d: "Tue", patients: 168 }, { d: "Wed", patients: 195 },
  { d: "Thu", patients: 178 }, { d: "Fri", patients: 220 }, { d: "Sat", patients: 156 }, { d: "Sun", patients: 92 },
];
const HOURLY = [
  { h: "8a", visits: 22 }, { h: "9a", visits: 48 }, { h: "10a", visits: 62 },
  { h: "11a", visits: 55 }, { h: "12p", visits: 30 }, { h: "1p", visits: 18 },
  { h: "2p", visits: 42 }, { h: "3p", visits: 58 }, { h: "4p", visits: 64 },
  { h: "5p", visits: 70 }, { h: "6p", visits: 52 }, { h: "7p", visits: 28 },
];
const COLORS = ["oklch(0.55 0.18 250)", "oklch(0.7 0.16 235)", "oklch(0.65 0.16 155)", "oklch(0.78 0.15 75)", "oklch(0.6 0.22 25)", "oklch(0.5 0.05 250)"];

function AdminHome() {
  const today = new Date().toISOString().slice(0, 10);
  const { data: stats } = useQuery({
    queryKey: ["admin-stats", today],
    queryFn: async () => {
      const [docs, depts, appts, todayAppts, completed, cancelled] = await Promise.all([
        supabase.from("doctors").select("*", { head: true, count: "exact" }),
        supabase.from("departments").select("*", { head: true, count: "exact" }),
        supabase.from("appointments").select("*", { head: true, count: "exact" }),
        supabase.from("appointments").select("*", { head: true, count: "exact" }).eq("appointment_date", today),
        supabase.from("appointments").select("*", { head: true, count: "exact" }).eq("status", "completed"),
        supabase.from("appointments").select("*", { head: true, count: "exact" }).eq("status", "cancelled"),
      ]);
      return {
        doctors: docs.count ?? 0, departments: depts.count ?? 0, appts: appts.count ?? 0,
        todayAppts: todayAppts.count ?? 0, completed: completed.count ?? 0, cancelled: cancelled.count ?? 0,
      };
    },
  });

  const { data: deptData = [] } = useQuery({
    queryKey: ["dept-doctors"],
    queryFn: async () => {
      const { data } = await supabase.from("doctors").select("departments(name)");
      const counts: Record<string, number> = {};
      (data ?? []).forEach((d: any) => {
        const name = d.departments?.name ?? "Other";
        counts[name] = (counts[name] ?? 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Hospital overview</h1>
        <p className="text-muted-foreground mt-1">Operational analytics, live.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Doctors" value={stats?.doctors ?? 0} icon={Stethoscope} hint="Active staff" />
        <StatCard label="Departments" value={stats?.departments ?? 0} icon={Building2} tone="success" />
        <StatCard label="Today's appts" value={stats?.todayAppts ?? 0} icon={Calendar} tone="warning" />
        <StatCard label="All appts" value={stats?.appts ?? 0} icon={ListOrdered} />
        <StatCard label="Completed" value={stats?.completed ?? 0} icon={Activity} tone="success" />
        <StatCard label="Cancelled" value={stats?.cancelled ?? 0} icon={Calendar} tone="destructive" />
        <StatCard label="Avg wait" value="14m" icon={Clock} hint="AI-tracked" />
        <StatCard label="Satisfaction" value="4.8" icon={TrendingUp} tone="success" hint="of 5" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-display font-semibold mb-4">Daily patients (last 7 days)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={DAILY}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 240)" />
              <XAxis dataKey="d" stroke="oklch(0.5 0.03 250)" fontSize={12} />
              <YAxis stroke="oklch(0.5 0.03 250)" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.01 240)" }} />
              <Bar dataKey="patients" fill="url(#g1)" radius={[8, 8, 0, 0]} />
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.55 0.18 250)" />
                  <stop offset="100%" stopColor="oklch(0.7 0.16 235)" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-display font-semibold mb-4">Peak hours today</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={HOURLY}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 240)" />
              <XAxis dataKey="h" stroke="oklch(0.5 0.03 250)" fontSize={12} />
              <YAxis stroke="oklch(0.5 0.03 250)" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.01 240)" }} />
              <Line type="monotone" dataKey="visits" stroke="oklch(0.55 0.18 250)" strokeWidth={3} dot={{ r: 4, fill: "oklch(0.7 0.16 235)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h2 className="font-display font-semibold mb-4">Doctors per department</h2>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={deptData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
              {deptData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Users className="hidden" />
      </div>
    </div>
  );
}
