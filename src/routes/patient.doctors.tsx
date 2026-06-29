import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Star, Stethoscope, Calendar as CalIcon, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/patient/doctors")({ component: Doctors });

const TIMES = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];

function Doctors() {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState<string>("all");
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => (await supabase.from("departments").select("*").order("name")).data ?? [],
  });
  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ["doctors", dept],
    queryFn: async () => {
      let qb = supabase.from("doctors").select("*, departments(name)").order("rating", { ascending: false });
      if (dept !== "all") qb = qb.eq("department_id", dept);
      return (await qb).data ?? [];
    },
  });

  const filtered = doctors.filter((d) =>
    !q || d.full_name.toLowerCase().includes(q.toLowerCase()) || d.specialization.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Find a doctor</h1>
        <p className="text-muted-foreground mt-1">Search by name or specialization and book a slot.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search doctors or specialty…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={dept} onValueChange={setDept}>
          <SelectTrigger className="w-full md:w-56"><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => <DoctorCard key={d.id} d={d} />)}
        </div>
      )}
    </div>
  );
}

function DoctorCard({ d }: { d: any }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function book() {
    if (!user || !time) return;
    setBusy(true);
    try {
      const { data: appt, error } = await supabase.from("appointments").insert({
        patient_id: user.id,
        doctor_id: d.id,
        department_id: d.department_id,
        appointment_date: date,
        appointment_time: time,
        reason,
      }).select().single();
      if (error) throw error;
      // also generate a token entry (waiting)
      const { count } = await supabase.from("queue_tokens").select("*", { head: true, count: "exact" })
        .eq("doctor_id", d.id).eq("token_date", date);
      await supabase.from("queue_tokens").insert({
        appointment_id: appt!.id,
        doctor_id: d.id,
        patient_id: user.id,
        token_number: (count ?? 0) + 1,
        token_date: date,
      });
      toast.success("Appointment booked");
      setOpen(false);
      navigate({ to: "/patient/appointments" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to book");
    } finally { setBusy(false); }
  }

  return (
    <div className="glass-card rounded-2xl p-6 hover:shadow-elegant-lg transition">
      <div className="flex items-start gap-4">
        <div className="size-14 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-lg shadow-glow">
          {d.full_name.split(" ").map((s: string) => s[0]).slice(0, 2).join("")}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold">{d.full_name}</h3>
            <Badge variant="secondary" className="text-xs"><Star className="size-3 fill-warning text-warning" /> {d.rating}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{d.specialization}</p>
          <p className="text-xs text-muted-foreground mt-1">{d.experience_years} yrs · ₹{d.consultation_fee}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground line-clamp-2">{d.bio}</p>
      <div className="mt-4 flex items-center gap-2">
        <Badge variant="outline" className="text-xs">{d.departments?.name}</Badge>
        <Badge variant="outline" className="text-xs"><Stethoscope className="size-3" /> ~{d.avg_consultation_minutes}m</Badge>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full mt-5 gradient-primary text-primary-foreground"><CalIcon className="size-4" /> Book appointment</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Book with {d.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Slot</label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {TIMES.map((t) => (
                  <button key={t} type="button" onClick={() => setTime(t)}
                    className={`px-2 py-2 rounded-lg text-sm border transition ${time === t ? "gradient-primary text-primary-foreground border-transparent" : "border-border hover:bg-accent"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Reason (optional)</label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Follow-up consult" />
            </div>
            <Button className="w-full gradient-primary text-primary-foreground" onClick={book} disabled={busy || !time}>
              {busy && <Loader2 className="size-4 animate-spin" />} Confirm booking
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
