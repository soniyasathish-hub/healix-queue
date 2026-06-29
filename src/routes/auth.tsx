import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth, pickHomePath } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

const search = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Sign in · QueueLess AI" }, { name: "description", content: "Access your QueueLess AI hospital dashboard." }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, roles, loading } = useAuth();
  const { redirect } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: redirect ?? pickHomePath(roles) });
    }
  }, [loading, user, roles, navigate, redirect]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password: pwd,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (error) throw error;
        toast.success("Account created — signing you in…");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pwd });
        if (error) throw error;
        toast.success("Welcome back");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
    } finally { setBusy(false); }
  }

  async function google() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error("Google sign-in failed"); setBusy(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-grid p-6">
      <div className="absolute inset-x-0 top-0 h-[60vh] gradient-hero opacity-10 pointer-events-none" />

      <div className="relative w-full max-w-md">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate({ to: "/" })}>
          <ArrowLeft className="size-4" /> Back to home
        </Button>
        <div className="glass-card rounded-3xl p-8 shadow-elegant-lg">
          <div className="flex items-center gap-2 justify-center">
            <div className="size-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Activity className="size-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg">QueueLess AI</span>
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")} className="mt-6">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <form onSubmit={submit} className="mt-5 space-y-4">
              <TabsContent value="signup" className="space-y-4 m-0">
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" required={mode === "signup"} value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
                </div>
              </TabsContent>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@hospital.com" />
              </div>
              <div>
                <Label htmlFor="pwd">Password</Label>
                <Input id="pwd" type="password" required minLength={6} value={pwd} onChange={(e) => setPwd(e.target.value)} />
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={busy}>
                {busy && <Loader2 className="size-4 animate-spin" />}
                {mode === "signup" ? "Create account" : "Sign in"}
              </Button>
            </form>
          </Tabs>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={google} disabled={busy}>
            <svg className="size-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.83Z"/><path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.07l3.66 2.83C6.71 7.18 9.14 4.75 12 4.75Z"/></svg>
            Continue with Google
          </Button>

          <p className="mt-6 text-xs text-center text-muted-foreground">
            By signing in you agree to our terms. New accounts are created as <strong>Patient</strong> by default.
          </p>
        </div>
      </div>
    </div>
  );
}
