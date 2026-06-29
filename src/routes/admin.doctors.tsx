import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/doctors")({ component: AdminDoctors });

function AdminDoctors() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", specialization: "", department_id: "", experience_years: 0, consultation_fee: 500, avg_consultation_minutes: 15, bio: "" });
  const { data: doctors = [] } = useQuery({
    queryKey: ["adm-doctors"],
    queryFn: async () => (await supabase.from("doctors").select("*, departments(name)").order("full_name")).data ?? [],
  });
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => (await supabase.from("departments").select("*").order("name")).data ?? [],
  });

  async function create() {
    const { error } = await supabase.from("doctors").insert({ ...form, department_id: form.department_id || null });
    if (error) toast.error(error.message); else { toast.success("Doctor added"); setOpen(false); qc.invalidateQueries({ queryKey: ["adm-doctors"] }); }
  }
  async function remove(id: string) {
    await supabase.from("doctors").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["adm-doctors"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold tracking-tight">Doctors</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gradient-primary text-primary-foreground"><Plus className="size-4" /> Add doctor</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add doctor</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              <Input placeholder="Specialization" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
              <Select value={form.department_id} onValueChange={(v) => setForm({ ...form, department_id: v })}>
                <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
                <SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
              <div className="grid grid-cols-3 gap-2">
                <Input type="number" placeholder="Years" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: +e.target.value })} />
                <Input type="number" placeholder="Fee" value={form.consultation_fee} onChange={(e) => setForm({ ...form, consultation_fee: +e.target.value })} />
                <Input type="number" placeholder="Avg min" value={form.avg_consultation_minutes} onChange={(e) => setForm({ ...form, avg_consultation_minutes: +e.target.value })} />
              </div>
              <Input placeholder="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              <Button className="w-full gradient-primary text-primary-foreground" onClick={create}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="glass-card rounded-2xl divide-y divide-border">
        {doctors.map((d: any) => (
          <div key={d.id} className="p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{d.full_name}</div>
              <div className="text-xs text-muted-foreground">{d.specialization} · {d.departments?.name}</div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => remove(d.id)}><Trash2 className="size-4 text-destructive" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
