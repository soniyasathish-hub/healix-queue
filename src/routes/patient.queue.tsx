import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Brain, Clock, ListOrdered, Sparkles, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Badge } from "@/components/ui/badge";
import { predictWaitTime } from "@/lib/ai.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/patient/queue")({ component: QueuePage });

function QueuePage() {
  const { user } = useAuth();
  const predict = useServerFn(predictWaitTime);
  const [prediction, setPrediction] = useState<{ estimatedMinutes: number; confidence: number; reasoning: string } | null>(null);
  const [predicting, setPredicting] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const { data: myToken } = useQuery({
    queryKey: ["my-token", user?.id, today],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("queue_tokens")
        .select("*, doctors(full_name, specialization, avg_consultation_minutes)")
        .eq("patient_id", user!.id)
        .eq("token_date", today)
        .in("status", ["waiting", "called", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const { data: queue = [], refetch } = useQuery({
    queryKey: ["queue-doctor", myToken?.doctor_id, today],
    enabled: !!myToken?.doctor_id,
    queryFn: async () => (await supabase
      .from("queue_tokens")
      .select("*")
      .eq("doctor_id", myToken!.doctor_id)
      .eq("token_date", today)
      .order("token_number")).data ?? [],
  });

  // Realtime
  useEffect(() => {
    if (!myToken?.doctor_id) return;
    const ch = supabase.channel("queue-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "queue_tokens", filter: `doctor_id=eq.${myToken.doctor_id}` },
        () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [myToken?.doctor_id, refetch]);

  const waitingTokens = queue.filter((q) => q.status === "waiting" || q.status === "called");
  const current = queue.find((q) => q.status === "in_progress" || q.status === "called");
  const position = myToken ? waitingTokens.findIndex((q) => q.id === myToken.id) + 1 : 0;
  const emergencyAhead = waitingTokens.filter((q, i) => i < position && q.priority === "emergency").length;

  // AI prediction
  useEffect(() => {
    if (!myToken || !myToken.doctors) return;
    setPredicting(true);
    predict({ data: {
      doctorName: myToken.doctors.full_name,
      specialization: myToken.doctors.specialization,
      queueLength: waitingTokens.length,
      avgConsultationMinutes: myToken.doctors.avg_consultation_minutes ?? 15,
      emergencyCount: emergencyAhead,
      positionInQueue: position,
      timeOfDay: new Date().toLocaleTimeString(),
    }})
      .then(setPrediction)
      .catch(() => setPrediction(null))
      .finally(() => setPredicting(false));
  }, [myToken?.id, waitingTokens.length, position, emergencyAhead, predict, myToken]);

  if (!myToken) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <ListOrdered className="size-10 mx-auto text-muted-foreground" />
        <h2 className="mt-4 font-display font-semibold text-lg">No active token</h2>
        <p className="text-muted-foreground mt-1">Book an appointment to receive your digital token.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Live queue</h1>
        <p className="text-muted-foreground mt-1">Real-time updates from the consultation room.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Token */}
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Your token</div>
          <div className="mt-3 mx-auto size-24 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-3xl shadow-glow animate-pulse-glow">
            {String(myToken.token_number).padStart(2, "0")}
          </div>
          <div className="mt-4 font-medium">{myToken.doctors?.full_name}</div>
          <div className="text-xs text-muted-foreground">{myToken.doctors?.specialization}</div>
          <div className="mt-4 inline-block bg-white p-2 rounded-lg">
            <QRCodeSVG value={`queueless:${myToken.id}`} size={96} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Show at reception for check-in</p>
        </div>

        {/* AI prediction */}
        <div className="lg:col-span-2 gradient-primary rounded-2xl p-6 text-primary-foreground shadow-elegant-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="relative">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-90">
              <Brain className="size-3.5" /> AI Wait-Time Prediction
            </div>
            {predicting ? (
              <div className="mt-6 flex items-center gap-3"><Loader2 className="size-5 animate-spin" /> Calculating…</div>
            ) : prediction ? (
              <>
                <div className="mt-3 flex items-end gap-3">
                  <div className="text-6xl font-display font-bold">{prediction.estimatedMinutes}</div>
                  <div className="pb-3 text-lg opacity-90">minutes</div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <Badge className="bg-white/20 text-white border-0"><Sparkles className="size-3" /> {prediction.confidence}% confidence</Badge>
                  <span className="opacity-80">Position #{position} · {waitingTokens.length} waiting</span>
                </div>
                <p className="mt-4 text-sm opacity-90 italic">"{prediction.reasoning}"</p>
              </>
            ) : (
              <div className="mt-6">Awaiting prediction…</div>
            )}
          </div>
        </div>
      </div>

      {/* Queue list */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold">Today's queue</h2>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="size-4" /> Now serving: <strong className="text-foreground">{current ? `#${current.token_number}` : "—"}</strong></span>
          </div>
        </div>
        <div className="space-y-2">
          {queue.map((t) => {
            const isMe = t.id === myToken.id;
            return (
              <div key={t.id} className={`flex items-center justify-between p-3 rounded-lg border ${isMe ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                <div className="flex items-center gap-3">
                  <div className={`size-10 rounded-lg flex items-center justify-center font-bold ${isMe ? "gradient-primary text-primary-foreground" : "bg-muted"}`}>
                    {String(t.token_number).padStart(2, "0")}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{isMe ? "You" : "Patient"}</div>
                    {t.priority === "emergency" && <Badge variant="destructive" className="text-xs">Emergency</Badge>}
                  </div>
                </div>
                <Badge variant={t.status === "done" ? "secondary" : t.status === "in_progress" ? "default" : "outline"} className="capitalize">
                  {t.status.replace("_", " ")}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
