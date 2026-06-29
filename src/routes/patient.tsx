import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/patient")({
  component: () => <AppShell><Outlet /></AppShell>,
});
