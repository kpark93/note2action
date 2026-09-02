/** Detail dialog for one action item, opened by clicking a Tasks or History
 * row — every edit is an optimistic write. Next hop: usePatchItem. */
import { useItemsQuery, usePatchItem } from "@/domain/items/items.queries";
import { OWNERS, PRIORITIES, STATUSES } from "@/domain/items/items.constants";
import { formatDate } from "@/lib/dates";
import type { Priority, Status } from "@/domain/items/items.types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ItemModalProps {
  /** Item to show, or null when closed. */
  itemId: number | null;
  onClose: () => void;
}

const FIELD_LABEL = "text-[11px] font-medium text-muted-foreground";
const FIELD_TRIGGER =
  "w-full rounded-[10px] border-border bg-secondary px-2 text-[12.5px] text-foreground data-[size=default]:h-8";

/** Title, owner/due/priority/status fields, and the editable AI rationale. */
export function ItemModal({ itemId, onClose }: ItemModalProps) {
  const items = useItemsQuery().data ?? [];
  const patchItem = usePatchItem();
  const item = items.find((i) => i.id === itemId) ?? null;

  // Text fields save on blur (one PATCH per edit, not per keystroke);
  // selects and the date input save immediately — same optimistic write
  // Review cards use, with rollback + toast on failure.
  const patch = (
    patchBody: Parameters<typeof patchItem.mutate>[0]["patch"],
  ) => {
    if (item) patchItem.mutate({ id: item.id, patch: patchBody });
  };

  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-[18px] border-border bg-card">
        {item && (
          // Keyed so defaultValue fields reset when a different item opens.
          <div key={item.id} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="text-[15px]">
                Edit action item
              </DialogTitle>
              <DialogDescription className="text-[12.5px]">
                From “{item.meeting}”
                {item.completed
                  ? ` · completed ${formatDate(item.completed)}`
                  : ""}
              </DialogDescription>
            </DialogHeader>

            <label className="flex flex-col gap-[6px]">
              <span className={FIELD_LABEL}>Title</span>
              <Textarea
                defaultValue={item.title}
                onBlur={(e) => {
                  if (e.target.value !== item.title)
                    patch({ title: e.target.value });
                }}
                rows={2}
                className="block field-sizing-fixed min-h-[38px] w-full resize-none rounded-[11px] border-border bg-secondary px-[9px] py-[6px] text-[14px] leading-[1.35] font-semibold tracking-[-0.02em] text-foreground shadow-none md:text-[14px] dark:bg-secondary"
              />
            </label>

            <div className="grid grid-cols-2 gap-[10px]">
              <label className="flex min-w-0 flex-col gap-[6px]">
                <span className={FIELD_LABEL}>Owner</span>
                <Select
                  value={item.owner}
                  onValueChange={(v) => patch({ owner: v })}
                >
                  <SelectTrigger className={FIELD_TRIGGER}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OWNERS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="flex min-w-0 flex-col gap-[6px]">
                <span className={FIELD_LABEL}>Due</span>
                <Input
                  type="date"
                  defaultValue={item.due}
                  onBlur={(e) => {
                    if (e.target.value !== item.due)
                      patch({ due: e.target.value });
                  }}
                  className="h-8 rounded-[10px] border-border bg-secondary px-2 text-[12.5px] text-foreground shadow-none md:text-[12.5px] dark:bg-secondary"
                />
              </label>
              <label className="flex min-w-0 flex-col gap-[6px]">
                <span className={FIELD_LABEL}>Priority</span>
                <Select
                  value={item.priority}
                  onValueChange={(v) => patch({ priority: v as Priority })}
                >
                  <SelectTrigger className={FIELD_TRIGGER}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="flex min-w-0 flex-col gap-[6px]">
                <span className={FIELD_LABEL}>Status</span>
                <Select
                  value={item.status}
                  onValueChange={(v) => patch({ status: v as Status })}
                >
                  <SelectTrigger className={FIELD_TRIGGER}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>

            <label className="flex flex-col gap-[6px]">
              <span className={FIELD_LABEL}>
                AI rationale — what the item was modeled after
              </span>
              <Textarea
                defaultValue={item.note ?? ""}
                onBlur={(e) => {
                  if (e.target.value !== (item.note ?? ""))
                    patch({ note: e.target.value });
                }}
                rows={3}
                className="block field-sizing-fixed w-full resize-none rounded-[11px] border-border bg-secondary px-[9px] py-[6px] text-[12.5px] leading-[1.5] text-foreground shadow-none md:text-[12.5px] dark:bg-secondary"
              />
            </label>

            <p className="text-[11.5px] text-muted-foreground">
              Edits save when you leave a field.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
