import { NavLink } from "react-router-dom";
import { useActionItems } from "@/store/actionItems.store";
import { summary } from "@/lib/items";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/capture", label: "Capture" },
  { to: "/review", label: "Review" },
  { to: "/tasks", label: "Tasks" },
  { to: "/history", label: "History" },
];

/** Workspace nav links; Review carries a badge counting items awaiting review. */
export function SidebarNav() {
  const items = useActionItems((s) => s.items);
  const { flagCount } = summary(items);

  return (
    <>
      <div className="mb-3 text-[10.5px] font-semibold tracking-[0.14em] text-muted-foreground">
        WORKSPACE
      </div>
      <nav className="flex flex-col gap-1">
        {NAV.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className="flex items-center justify-between rounded-[13px] px-[13px] py-[11px] text-left text-[14px]"
            style={({ isActive }) => ({
              background: isActive ? "hsl(var(--secondary))" : "transparent",
              color: isActive
                ? "hsl(var(--foreground))"
                : "hsl(var(--muted-foreground))",
              fontWeight: isActive ? 600 : 500,
            })}
          >
            {label}
            {to === "/review" && flagCount > 0 && (
              <Badge className="px-[7px] py-px text-[11px] font-semibold">
                {flagCount}
              </Badge>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
