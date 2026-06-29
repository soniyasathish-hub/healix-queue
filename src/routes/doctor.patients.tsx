import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/doctor/patients")({ component: DocPatients });

function DocPatients() {
  const { user } = useAuth();
  const { data: doctor } = useQuery({
    queryKey: ["my-doctor", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("doctors").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });
  const { data: patients = [] } = useQuery({
    queryKey: ["my-patients", doctor?.id], enabled: !!doctor,
    queryFn: async () => {
      const { data } = await supabase.from("appointments")
        .select("patient_id, profiles:patient_id(full_name, phone)")
        .eq("doctor_id", doctor!.id);
      const unique = new Map<string, any>();
      (data ?? []).forEach((a: any) => unique.set(a.patient_id, a.profiles));
      return Array.from(unique.entries()).map(([id, p]) => ({ id, ...p }));
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold tracking-tight">My patients</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {patients.map((p) => (
          <div key={p.id} className="glass-card rounded-2xl p-5 flex items-center gap-4">
            <div className="size-12 rounded-xl gradient-primary text-primary-foreground font-bold flex items-center justify-center">
              {(p.full_name ?? "P")[0]}
            </div>
            <div>
              <div className="font-medium">{p.full_name ?? "Patient"}</div>
              <div className="text-xs text-muted-foreground">{p.phone ?? "—"}</div>
            </div>
          </div>
        ))}
        {patients.length === 0 && <div className="text-muted-foreground">No patients yet.</div>}
      </div>
    </div>
  );
}
