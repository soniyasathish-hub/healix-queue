import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "destructive";
  delta?: string;
}

export function StatCard({ label, value, hint, icon: Icon, tone = "primary", delta }: Props) {
  const toneClass = {
    primary: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    destructive: "text-destructive bg-destructive/10",
  }[tone];

  return (
    <div className="stat-card hover:stat-card-hover group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
          <p className="mt-2 text-3xl font-display font-bold tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("size-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", toneClass)}>
          <Icon className="size-5" />
        </div>
      </div>
      {delta && (
        <div className="mt-3 text-xs font-medium text-success">{delta}</div>
      )}
    </div>
  );
}
