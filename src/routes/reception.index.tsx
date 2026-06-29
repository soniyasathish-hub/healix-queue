import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { Calendar, ListOrdered, ClipboardList, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reception/")({ component: ReceptionHome });

function ReceptionHome() {
  const today = new Date().toISOString().slice(0, 10);
  const { data: stats } = useQuery({
    queryKey: ["recept-stats", today],
    queryFn: async () => {
      const [a, t] = await Promise.all([
        supabase.from("appointments").select("*", { head: true, count: "exact" }).eq("appointment_date", today),
        supabase.from("queue_tokens").select("*", { head: true, count: "exact" }).eq("token_date", today),
      ]);
      return { appts: a.count ?? 0, tokens: t.count ?? 0 };
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Reception</h1>
          <p className="text-muted-foreground mt-1">Manage check-ins, walk-ins and today's queue.</p>
        </div>
        <Link to="/reception/checkin"><Button className="gradient-primary text-primary-foreground">New check-in</Button></Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Today's appts" value={stats?.appts ?? 0} icon={Calendar} />
        <StatCard label="Tokens issued" value={stats?.tokens ?? 0} icon={ListOrdered} tone="success" />
        <StatCard label="Walk-ins" value="—" icon={ClipboardList} tone="warning" />
        <StatCard label="Active queues" value="6" icon={Activity} />
      </div>
    </div>
  );
}
