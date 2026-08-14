import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  /** Label for the catch-all option, e.g. "All owners". */
  allLabel: string;
  options: readonly string[];
  className?: string;
}

/** Filter dropdown (owner/status): styled trigger + an "All" option ahead of the choices. */
export function FilterSelect({
  value,
  onValueChange,
  allLabel,
  options,
  className,
}: FilterSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
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
