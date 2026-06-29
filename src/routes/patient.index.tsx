import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { StatCard } from "@/components/StatCard";
import { Calendar, ListOrdered, FileText, Stethoscope, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export const Route = createFileRoute("/patient/")({ component: PatientHome });

function PatientHome() {
  const { user } = useAuth();
  const { data: appts = [] } = useQuery({
    queryKey: ["my-appts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("*, doctors(full_name, specialization)")
        .eq("patient_id", user!.id)
        .order("appointment_date", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = appts.filter((a) => a.appointment_date >= today && a.status !== "cancelled" && a.status !== "completed");
  const completed = appts.filter((a) => a.status === "completed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground mt-1">Here is your care overview.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Upcoming" value={upcoming.length} icon={Calendar} hint="Scheduled visits" />
        <StatCard label="Live tokens" value={upcoming.filter((a) => a.status === "checked_in" || a.status === "in_consultation").length} icon={ListOrdered} tone="success" hint="Active in queue" />
        <StatCard label="Past visits" value={completed.length} icon={FileText} tone="warning" />
        <StatCard label="Avg wait" value="14m" icon={Clock} hint="Last 30 days" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg">Upcoming appointments</h2>
            <Link to="/patient/appointments"><Button variant="ghost" size="sm">View all <ArrowRight className="size-4" /></Button></Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No upcoming visits.</p>
              <Link to="/patient/doctors"><Button className="mt-4 gradient-primary text-primary-foreground">Find a doctor</Button></Link>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {upcoming.map((a) => (
                <li key={a.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{a.doctors?.full_name ?? "Doctor"}</div>
                    <div className="text-sm text-muted-foreground">{a.doctors?.specialization} · {format(new Date(a.appointment_date + "T" + a.appointment_time), "MMM d, h:mm a")}</div>
                  </div>
                  <span className="text-xs uppercase font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">{a.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link to="/patient/doctors" className="glass-card rounded-2xl p-6 hover:shadow-elegant-lg transition group">
          <div className="size-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow group-hover:scale-110 transition">
            <Stethoscope className="size-5 text-primary-foreground" />
          </div>
          <h3 className="mt-4 font-display font-semibold">Book a new visit</h3>
          <p className="text-sm text-muted-foreground mt-1">Browse our specialists and reserve your slot.</p>
          <div className="mt-4 text-sm text-primary font-medium flex items-center gap-1">Find doctors <ArrowRight className="size-4" /></div>
        </Link>
      </div>
    </div>
  );
}
