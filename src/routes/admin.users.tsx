import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

const ROLES = ["patient", "doctor", "receptionist", "admin"] as const;

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });

function AdminUsers() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: profiles = [] } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => (await supabase.from("profiles").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: roles = [] } = useQuery({
    queryKey: ["all-roles"],
    queryFn: async () => (await supabase.from("user_roles").select("*")).data ?? [],
  });

  async function addRole(uid: string, role: any) {
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role });
    if (error) toast.error(error.message); else { toast.success("Role added"); qc.invalidateQueries({ queryKey: ["all-roles"] }); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Users & roles</h1>
        <p className="text-muted-foreground mt-1">Grant doctor / receptionist / admin access. You ({user?.email}) need admin role to manage others.</p>
      </div>
      <div className="glass-card rounded-2xl divide-y divide-border">
        {profiles.map((p) => {
          const userRoles = roles.filter((r) => r.user_id === p.id).map((r) => r.role);
          return (
            <Row key={p.id} name={p.full_name} userId={p.id} roles={userRoles} onAdd={addRole} />
          );
        })}
      </div>
    </div>
  );
}

function Row({ name, userId, roles, onAdd }: { name: string; userId: string; roles: string[]; onAdd: (uid: string, role: any) => void }) {
  const [role, setRole] = useState<string>("");
  return (
    <div className="p-4 flex flex-wrap items-center gap-3 justify-between">
      <div>
        <div className="font-medium">{name || "—"}</div>
        <div className="flex gap-1 mt-1">{roles.map((r) => <Badge key={r} variant="secondary" className="capitalize">{r}</Badge>)}</div>
      </div>
      <div className="flex gap-2">
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Add role" /></SelectTrigger>
          <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
        </Select>
        <Button size="sm" disabled={!role} onClick={() => { onAdd(userId, role); setRole(""); }}>Grant</Button>
      </div>
    </div>
  );
}
