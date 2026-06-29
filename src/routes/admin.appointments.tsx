import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/appointments")({ component: A });
function A() {
  const { data = [] } = useQuery({
    queryKey: ["adm-appts"],
    queryFn: async () => (await supabase.from("appointments")
      .select("*, doctors(full_name), profiles:patient_id(full_name)")
      .order("appointment_date", { ascending: false }).limit(100)).data ?? [],
  });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold tracking-tight">All appointments</h1>
      <div className="glass-card rounded-2xl divide-y divide-border">
        {data.map((a: any) => (
          <div key={a.id} className="p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{a.profiles?.full_name} → {a.doctors?.full_name}</div>
              <div className="text-xs text-muted-foreground">{format(new Date(a.appointment_date + "T" + a.appointment_time), "MMM d, h:mm a")}</div>
            </div>
            <Badge variant="outline" className="capitalize">{a.status.replace("_", " ")}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
