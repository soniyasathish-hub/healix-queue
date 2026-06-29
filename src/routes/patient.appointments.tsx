import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { Calendar, X, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/patient/appointments")({ component: MyAppts });

function MyAppts() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: appts = [] } = useQuery({
    queryKey: ["all-appts", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("appointments")
      .select("*, doctors(full_name, specialization)")
      .eq("patient_id", user!.id)
      .order("appointment_date", { ascending: false })).data ?? [],
  });

  async function cancel(id: string) {
    const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Cancelled"); qc.invalidateQueries({ queryKey: ["all-appts"] }); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">My appointments</h1>
          <p className="text-muted-foreground mt-1">Manage upcoming and past visits.</p>
        </div>
        <Link to="/patient/doctors"><Button className="gradient-primary text-primary-foreground"><Calendar className="size-4" /> Book new</Button></Link>
      </div>

      {appts.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <p className="text-muted-foreground">No appointments yet.</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl divide-y divide-border">
          {appts.map((a) => (
            <div key={a.id} className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="font-medium">{a.doctors?.full_name}</div>
                <div className="text-sm text-muted-foreground">{a.doctors?.specialization}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {format(new Date(a.appointment_date + "T" + a.appointment_time), "EEE, MMM d · h:mm a")}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={a.status === "cancelled" ? "destructive" : a.status === "completed" ? "secondary" : "default"} className="capitalize">{a.status.replace("_", " ")}</Badge>
                {a.status !== "cancelled" && a.status !== "completed" && (
                  <>
                    <Link to="/patient/queue" search={{ doctor: a.doctor_id } as never}>
                      <Button size="sm" variant="outline"><ArrowRight className="size-4" /> Queue</Button>
                    </Link>
                    <Button size="sm" variant="ghost" onClick={() => cancel(a.id)}><X className="size-4" /></Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
