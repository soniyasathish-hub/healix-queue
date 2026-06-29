import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/departments")({ component: AdminDepts });
function AdminDepts() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const { data = [] } = useQuery({ queryKey: ["departments"], queryFn: async () => (await supabase.from("departments").select("*").order("name")).data ?? [] });
  async function add() {
    if (!name) return;
    const { error } = await supabase.from("departments").insert({ name });
    if (error) toast.error(error.message); else { setName(""); qc.invalidateQueries({ queryKey: ["departments"] }); }
  }
  async function remove(id: string) { await supabase.from("departments").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["departments"] }); }
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold tracking-tight">Departments</h1>
      <div className="glass-card rounded-2xl p-4 flex gap-2">
        <Input placeholder="New department name" value={name} onChange={(e) => setName(e.target.value)} />
        <Button onClick={add} className="gradient-primary text-primary-foreground"><Plus className="size-4" /> Add</Button>
      </div>
      <div className="glass-card rounded-2xl divide-y divide-border">
        {data.map((d) => (
          <div key={d.id} className="p-4 flex items-center justify-between">
            <div className="font-medium">{d.name}</div>
            <Button size="sm" variant="ghost" onClick={() => remove(d.id)}><Trash2 className="size-4 text-destructive" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
