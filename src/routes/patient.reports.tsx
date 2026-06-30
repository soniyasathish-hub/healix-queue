import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Upload, Trash2, Download, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { summarizeReport } from "@/lib/ai.functions";

export const Route = createFileRoute("/patient/reports")({ component: ReportsPage });

function ReportsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const aiSummary = useServerFn(summarizeReport);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [summarizingId, setSummarizingId] = useState<string | null>(null);

  async function getSummary(id: string, t: string, ft?: string | null) {
    setSummarizingId(id);
    try {
      const res = await aiSummary({ data: { title: t, fileType: ft ?? undefined } });
      setSummaries((s) => ({ ...s, [id]: res.summary }));
    } catch {
      toast.error("Could not generate summary");
    } finally {
      setSummarizingId(null);
    }
  }
  const [title, setTitle] = useState("");

  const { data: reports = [] } = useQuery({
    queryKey: ["reports", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("medical_reports").select("*").eq("patient_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setBusy(true);
    try {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("medical-reports").upload(path, file);
      if (upErr) throw upErr;
      const { error } = await supabase.from("medical_reports").insert({
        patient_id: user.id,
        title: title || file.name,
        file_path: path,
        file_type: file.type,
      });
      if (error) throw error;
      setTitle("");
      toast.success("Uploaded");
      qc.invalidateQueries({ queryKey: ["reports"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally { setBusy(false); e.target.value = ""; }
  }

  async function download(path: string) {
    const { data, error } = await supabase.storage.from("medical-reports").createSignedUrl(path, 60);
    if (error) toast.error(error.message);
    else window.open(data.signedUrl, "_blank");
  }

  async function remove(id: string, path: string) {
    await supabase.storage.from("medical-reports").remove([path]);
    await supabase.from("medical_reports").delete().eq("id", id);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["reports"] });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Medical reports</h1>
        <p className="text-muted-foreground mt-1">Upload lab reports, prescriptions and scans securely.</p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col md:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="text-sm font-medium">Report title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Blood test — Mar 2026" />
          </div>
          <Button asChild disabled={busy} className="gradient-primary text-primary-foreground">
            <label className="cursor-pointer">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              Upload file
              <input type="file" hidden onChange={upload} accept="image/*,application/pdf" />
            </label>
          </Button>
        </div>
      </div>

      <div className="glass-card rounded-2xl divide-y divide-border">
        {reports.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No reports yet.</div>
        ) : reports.map((r) => (
          <div key={r.id} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"><FileText className="size-5" /></div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{r.title}</div>
                  <div className="text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d, yyyy")}</div>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="ghost" onClick={() => getSummary(r.id, r.title, r.file_type)} disabled={summarizingId === r.id} title="AI summary">
                  {summarizingId === r.id ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4 text-primary" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => download(r.file_path)}><Download className="size-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => remove(r.id, r.file_path)}><Trash2 className="size-4 text-destructive" /></Button>
              </div>
            </div>
            {summaries[r.id] && (
              <div className="mt-3 ml-13 p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm text-muted-foreground whitespace-pre-wrap">
                <div className="flex items-center gap-1.5 text-xs font-medium text-primary mb-1.5"><Sparkles className="size-3" /> AI Summary</div>
                {summaries[r.id]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
