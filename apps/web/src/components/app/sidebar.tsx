// Left-hand app chrome: logo, nav links, completion widget, theme switch,
// and the signed-in account. Rendered once by app-layout.tsx, so it (and its
// children) are the only place these cross-screen bits live.
// Path: app-layout.tsx → [this file] → SidebarNav, CompletionCard,
// health.queries (domain), theme.store (lib), Clerk's <UserButton>.
import { UserButton, useUser } from "@clerk/clerk-react";
import { useHealth } from "@/domain/health/health.queries";
import { useTheme } from "@/lib/theme.store";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "./sidebar-nav";
import { CompletionCard } from "./completion-card";

/** Fixed sidebar: logo, nav, completion widget, theme toggle, account row. */
export function Sidebar() {
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);

  // The real signed-in account, from Clerk. The sidebar only renders inside
  // <RequireAuth>, so `user` is loaded — the fallbacks are just type safety.
  const { user } = useUser();
  const displayName = user?.fullName ?? user?.username ?? "Account";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  // Live API health, surfaced as a small dot — keeps the TanStack Query
  // health check and the Vite /api proxy wired into the real UI.
  const health = useHealth();
  const healthColor =
    health.status === "success"
      ? "hsl(var(--success))"
      : health.status === "error"
        ? "hsl(var(--destructive))"
        : "hsl(var(--warning))";
  const healthLabel =
    health.status === "success"
      ? "API online"
      : health.status === "error"
        ? "API offline"
        : "Checking API…";

  return (
    <aside className="flex w-[198px] flex-none flex-col overflow-hidden rounded-[20px] bg-background px-4 py-[18px]">
      <div className="mb-[22px] flex items-center gap-[10px]">
        <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[10px] bg-primary text-[11px] font-extrabold tracking-[-0.02em] text-primary-foreground">
          n2a
        </span>
        <span className="text-[15px] font-bold tracking-[-0.02em]">
          note2action
        </span>
      </div>

      <SidebarNav />

      <div className="min-h-[34px] flex-1" />

      <CompletionCard />

      <div className="mt-[14px] grid grid-cols-2 gap-1 rounded-[12px] border border-border bg-card p-1">
        {(["light", "dark"] as const).map((mode) => {
          const active = theme === mode;
          return (
            <Button
              key={mode}
              variant="ghost"
              onClick={() => setTheme(mode)}
              aria-pressed={active}
              className="h-auto w-full gap-[6px] rounded-[9px] px-0 py-[6px] text-[12px] font-medium"
              style={{
                background: active ? "hsl(var(--secondary))" : "transparent",
                color: active
                  ? "hsl(var(--foreground))"
                  : "hsl(var(--muted-foreground))",
              }}
            >
              <span aria-hidden="true">{mode === "light" ? "☀" : "☾"}</span>
              {mode === "light" ? "Light" : "Dark"}
            </Button>
          );
        })}
      </div>

      <div className="mt-[14px] flex items-center gap-[11px] border-t border-border pt-[14px]">
        {/* Clerk avatar + account menu (manage account, sign out). */}
        <UserButton
          appearance={{ elements: { avatarBox: "h-8 w-8 rounded-[11px]" } }}
        />
        <span className="flex min-w-0 flex-col leading-[1.3]">
          <span className="truncate text-[13px] font-semibold">
            {displayName}
          </span>
          <span className="truncate text-[11px] text-muted-foreground">
            {email}
          </span>
        </span>
        <span
          className="ml-auto h-[7px] w-[7px] flex-none rounded-full"
          style={{ background: healthColor }}
          title={healthLabel}
        />
      </div>
    </aside>
  );
}
