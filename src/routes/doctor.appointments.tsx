import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const Route = createFileRoute("/doctor/appointments")({ component: DocAppts });

function DocAppts() {
  const { user } = useAuth();
  const { data: doctor } = useQuery({
    queryKey: ["my-doctor", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("doctors").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });
  const { data: appts = [] } = useQuery({
    queryKey: ["doc-appts", doctor?.id],
    enabled: !!doctor,
    queryFn: async () => (await supabase.from("appointments")
      .select("*, profiles:patient_id(full_name)")
      .eq("doctor_id", doctor!.id)
      .order("appointment_date", { ascending: false })).data ?? [],
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold tracking-tight">Appointments</h1>
      <div className="glass-card rounded-2xl divide-y divide-border">
        {appts.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No appointments.</div>
        ) : appts.map((a) => (
          <div key={a.id} className="p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{(a as any).profiles?.full_name ?? "Patient"}</div>
              <div className="text-xs text-muted-foreground">{format(new Date(a.appointment_date + "T" + a.appointment_time), "MMM d, h:mm a")}</div>
              {a.reason && <div className="text-xs text-muted-foreground mt-1">{a.reason}</div>}
            </div>
            <Badge variant="outline" className="capitalize">{a.status.replace("_", " ")}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
