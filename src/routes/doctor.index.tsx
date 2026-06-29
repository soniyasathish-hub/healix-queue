import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { Users, ListOrdered, CheckCircle2, Clock, Play, SkipForward, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/doctor/")({ component: DoctorHome });

function DoctorHome() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: doctor } = useQuery({
    queryKey: ["my-doctor", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("doctors").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });

  const { data: queue = [], refetch } = useQuery({
    queryKey: ["doctor-queue", doctor?.id, today],
    enabled: !!doctor,
    queryFn: async () => (await supabase
      .from("queue_tokens")
      .select("*, profiles:patient_id(full_name)")
      .eq("doctor_id", doctor!.id)
      .eq("token_date", today)
      .order("token_number")).data ?? [],
  });

  useEffect(() => {
    if (!doctor?.id) return;
    const ch = supabase.channel("doc-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "queue_tokens", filter: `doctor_id=eq.${doctor.id}` }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [doctor?.id, refetch]);

  const waiting = queue.filter((q) => q.status === "waiting" || q.status === "called");
  const inProgress = queue.find((q) => q.status === "in_progress");
  const done = queue.filter((q) => q.status === "done");

  async function action(id: string, status: "called" | "in_progress" | "done" | "skipped") {
    const patch: any = { status };
    if (status === "called") patch.called_at = new Date().toISOString();
    if (status === "in_progress") patch.started_at = new Date().toISOString();
    if (status === "done") patch.completed_at = new Date().toISOString();
    const { error } = await supabase.from("queue_tokens").update(patch).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(`Marked ${status}`); qc.invalidateQueries({ queryKey: ["doctor-queue"] }); }
  }

  async function callNext() {
    const next = waiting[0];
    if (!next) return toast.info("No more patients in queue");
    await action(next.id, "in_progress");
  }

  if (!doctor) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <p>Your doctor profile is not linked yet. Ask an admin to link your account to a doctor record.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Today's queue</h1>
          <p className="text-muted-foreground mt-1">{doctor.full_name} · {doctor.specialization}</p>
        </div>
        <Button className="gradient-primary text-primary-foreground" onClick={callNext}>
          <Play className="size-4" /> Call next
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="In queue" value={waiting.length} icon={ListOrdered} />
        <StatCard label="In consultation" value={inProgress ? 1 : 0} icon={Users} tone="warning" />
        <StatCard label="Completed today" value={done.length} icon={CheckCircle2} tone="success" />
        <StatCard label="Avg time" value={`${doctor.avg_consultation_minutes}m`} icon={Clock} />
      </div>

      {inProgress && (
        <div className="glass-card rounded-2xl p-6 border-l-4 border-l-primary">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-xl gradient-primary text-primary-foreground font-display font-bold text-xl flex items-center justify-center animate-pulse-glow">
                {String(inProgress.token_number).padStart(2, "0")}
              </div>
              <div>
                <div className="text-xs uppercase text-muted-foreground">Now consulting</div>
                <div className="font-display font-semibold text-lg">{(inProgress as any).profiles?.full_name ?? "Patient"}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => action(inProgress.id, "skipped")}><SkipForward className="size-4" /> Skip</Button>
              <Button className="gradient-primary text-primary-foreground" onClick={() => action(inProgress.id, "done")}><Check className="size-4" /> Complete</Button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl p-6">
        <h2 className="font-display font-semibold mb-4">Waiting</h2>
        {waiting.length === 0 ? <p className="text-muted-foreground text-sm">Queue is empty.</p> : (
          <div className="space-y-2">
            {waiting.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-card border font-bold flex items-center justify-center">{String(t.token_number).padStart(2, "0")}</div>
                  <div>
                    <div className="text-sm font-medium">{(t as any).profiles?.full_name ?? "Patient"}</div>
                    {t.priority === "emergency" && <Badge variant="destructive" className="text-xs">Emergency</Badge>}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => action(t.id, "in_progress")}>Start</Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
