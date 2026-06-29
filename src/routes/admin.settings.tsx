import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({ component: Settings });

function Settings() {
  const { user, refreshRoles } = useAuth();
  async function makeMeAdmin() {
    if (!user) return;
    const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role: "admin" });
    if (error && !error.message.includes("duplicate")) toast.error(error.message);
    else { toast.success("Admin granted"); await refreshRoles(); }
  }
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold tracking-tight">Settings</h1>
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="size-5 text-primary mt-1" />
          <div>
            <h3 className="font-display font-semibold">Bootstrap admin</h3>
            <p className="text-sm text-muted-foreground">First-run helper: grant your own account the admin role so you can manage doctors and users.</p>
            <Button className="mt-3 gradient-primary text-primary-foreground" onClick={makeMeAdmin}>Make me admin</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
