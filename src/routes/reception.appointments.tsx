import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const Route = createFileRoute("/reception/appointments")({ component: ReceptAppts });

function ReceptAppts() {
  const { data: appts = [] } = useQuery({
    queryKey: ["all-recept-appts"],
    queryFn: async () => (await supabase.from("appointments")
      .select("*, doctors(full_name), profiles:patient_id(full_name)")
      .order("appointment_date", { ascending: false }).limit(50)).data ?? [],
  });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold tracking-tight">All appointments</h1>
      <div className="glass-card rounded-2xl divide-y divide-border">
        {appts.map((a: any) => (
          <div key={a.id} className="p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{a.profiles?.full_name}</div>
              <div className="text-xs text-muted-foreground">{a.doctors?.full_name} · {format(new Date(a.appointment_date + "T" + a.appointment_time), "MMM d, h:mm a")}</div>
            </div>
            <Badge variant="outline" className="capitalize">{a.status.replace("_", " ")}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
