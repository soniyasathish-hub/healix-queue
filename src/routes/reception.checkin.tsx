import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, Search } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";

export const Route = createFileRoute("/reception/checkin")({ component: CheckIn });

function CheckIn() {
  const [q, setQ] = useState("");
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: appts = [] } = useQuery({
    queryKey: ["today-appts", today],
    queryFn: async () => (await supabase.from("appointments")
      .select("*, doctors(full_name), profiles:patient_id(full_name, phone)")
      .eq("appointment_date", today)
      .order("appointment_time")).data ?? [],
  });

  const filtered = appts.filter((a: any) =>
    !q || a.profiles?.full_name?.toLowerCase().includes(q.toLowerCase()) || a.profiles?.phone?.includes(q)
  );

  async function checkin(id: string) {
    const { error } = await supabase.from("appointments").update({ status: "checked_in" }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Patient checked in"); qc.invalidateQueries({ queryKey: ["today-appts"] }); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Check-in</h1>
        <p className="text-muted-foreground mt-1">Today's scheduled patients.</p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by name or phone…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="glass-card rounded-2xl divide-y divide-border">
        {filtered.length === 0 ? <div className="p-12 text-center text-muted-foreground">No appointments today.</div> :
          filtered.map((a: any) => (
            <div key={a.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{a.profiles?.full_name ?? "Patient"}</div>
                <div className="text-xs text-muted-foreground">{a.doctors?.full_name} · {format(new Date(today + "T" + a.appointment_time), "h:mm a")}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">{a.status.replace("_", " ")}</Badge>
                {a.status === "scheduled" && (
                  <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => checkin(a.id)}>
                    <Check className="size-4" /> Check in
                  </Button>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
