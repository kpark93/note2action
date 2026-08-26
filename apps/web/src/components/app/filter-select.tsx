/** Generic "All X / one of these" filter dropdown used by Tasks and History —
 * wraps components/ui/select. */
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterSelectProps<T extends string> {
  value: T | "All";
  onValueChange: (value: T | "All") => void;
  /** Label for the catch-all option, e.g. "All owners". */
  allLabel: string;
  options: readonly T[];
  className?: string;
}

/** Filter dropdown (owner/status): styled trigger + an "All" option ahead of the choices. */
export function FilterSelect<T extends string>({
  value,
  onValueChange,
  allLabel,
  options,
  className,
}: FilterSelectProps<T>) {
  return (
    // The only rendered values are "All" and `options` members, so the
    // narrowing cast from Radix's plain string is sound.
    <Select value={value} onValueChange={(v) => onValueChange(v as T | "All")}>
      <SelectTrigger
        className={cn(
          "min-w-[164px] rounded-[12px] border-border bg-card px-[13px] text-[13px] text-foreground data-[size=default]:h-[38px]",
          className,
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="All">{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
