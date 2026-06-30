import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { useAuth, pickHomePath, type AppRole } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AIChatbot } from "@/components/AIChatbot";
import {
  LayoutDashboard, Calendar, Users, Stethoscope, ListOrdered, FileText,
  LogOut, Activity, Settings, Building2, Bell, ClipboardList, Sparkles, Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem { to: string; label: string; icon: typeof LayoutDashboard }

const NAV: Record<AppRole, NavItem[]> = {
  patient: [
    { to: "/patient", label: "Dashboard", icon: LayoutDashboard },
    { to: "/patient/doctors", label: "Find Doctors", icon: Stethoscope },
    { to: "/patient/appointments", label: "My Appointments", icon: Calendar },
    { to: "/patient/queue", label: "Live Queue", icon: ListOrdered },
    { to: "/patient/reports", label: "Medical Reports", icon: FileText },
  ],
  doctor: [
    { to: "/doctor", label: "Today's Queue", icon: LayoutDashboard },
    { to: "/doctor/appointments", label: "Appointments", icon: Calendar },
    { to: "/doctor/patients", label: "Patients", icon: Users },
  ],
  receptionist: [
    { to: "/reception", label: "Dashboard", icon: LayoutDashboard },
    { to: "/reception/checkin", label: "Check-in", icon: ClipboardList },
    { to: "/reception/appointments", label: "Appointments", icon: Calendar },
  ],
  admin: [
    { to: "/admin", label: "Overview", icon: LayoutDashboard },
    { to: "/admin/doctors", label: "Doctors", icon: Stethoscope },
    { to: "/admin/departments", label: "Departments", icon: Building2 },
    { to: "/admin/appointments", label: "Appointments", icon: Calendar },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/settings", label: "Settings", icon: Settings },
  ],
};

function SidebarBody({
  items, path, role, onNavigate, onSignOut,
}: {
  items: NavItem[]; path: string; role: AppRole;
  onNavigate?: () => void; onSignOut: () => void;
}) {
  return (
    <>
      <Link to="/" onClick={onNavigate} className="flex items-center gap-2 px-6 h-16 border-b border-border/50">
        <div className="size-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
          <Activity className="size-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="font-display font-bold leading-tight truncate">QueueLess</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">AI Hospital</div>
        </div>
      </Link>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {items.map((it) => {
          const active = path === it.to || (it.to !== `/${role}` && path.startsWith(it.to));
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "gradient-primary text-primary-foreground shadow-elegant"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Icon className="size-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border/50">
        <div className="px-3 py-2 text-xs text-muted-foreground capitalize">Signed in as {role}</div>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={onSignOut}>
          <LogOut className="size-4" /> Sign out
        </Button>
      </div>
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, roles, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: path } as never });
  }, [loading, user, navigate, path]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const role: AppRole =
    roles.includes("admin") ? "admin" :
    roles.includes("doctor") ? "doctor" :
    roles.includes("receptionist") ? "receptionist" : "patient";
  const items = NAV[role];
  const handleSignOut = async () => { await signOut(); navigate({ to: "/" }); };

  return (
    <div className="min-h-screen gradient-soft">
      <div className="flex">
        <aside className="hidden md:flex w-64 shrink-0 h-screen sticky top-0 flex-col glass border-r border-border/50">
          <SidebarBody items={items} path={path} role={role} onSignOut={handleSignOut} />
        </aside>

        <main className="flex-1 min-w-0">
          <header className="sticky top-0 z-30 glass border-b border-border/50">
            <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-8">
              <div className="flex items-center gap-2 md:hidden">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Open menu">
                      <Menu className="size-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-72 flex flex-col">
                    <SidebarBody
                      items={items} path={path} role={role}
                      onNavigate={() => setMobileOpen(false)}
                      onSignOut={async () => { setMobileOpen(false); await handleSignOut(); }}
                    />
                  </SheetContent>
                </Sheet>
                <div className="size-8 rounded-lg gradient-primary flex items-center justify-center">
                  <Activity className="size-4 text-white" />
                </div>
                <span className="font-display font-bold">QueueLess</span>
              </div>
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                <Sparkles className="size-4 text-primary shrink-0" />
                <span className="truncate">AI-powered queue intelligence active</span>
              </div>
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <Button variant="ghost" size="icon" onClick={() => navigate({ to: pickHomePath(roles) })} aria-label="Notifications">
                  <Bell className="size-4" />
                </Button>
                <div className="size-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
                  {(user.email ?? "U")[0].toUpperCase()}
                </div>
              </div>
            </div>
          </header>
          <div className="p-4 md:p-8 max-w-[1400px] mx-auto">{children}</div>
        </main>
      </div>

      {role === "patient" && <AIChatbot />}
    </div>
  );
}
