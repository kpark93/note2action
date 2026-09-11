/** Detail dialog for one item; every edit is an optimistic write via usePatchItem. */
import { useRef } from "react";
import { useItemQuery, usePatchItem } from "@/domain/items/items.queries";
import { PRIORITIES, STATUSES } from "@/domain/items/items.constants";
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

const FIELD_LABEL = "text-label font-medium text-muted-foreground";
const FIELD_TRIGGER =
  "w-full rounded-control border-border bg-secondary px-2 text-body text-foreground data-[size=default]:h-8";

/** Shell owns the Dialog; body mounts only while open, ref holds the id through exit. */
export function ItemModal({ itemId, onClose }: ItemModalProps) {
  const lastId = useRef<number | null>(null);
  if (itemId !== null) lastId.current = itemId;
  const shownId = itemId ?? lastId.current;

  return (
    <Dialog open={itemId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-[18px] border-border bg-card">
        {shownId !== null && <ItemModalBody id={shownId} />}
      </DialogContent>
    </Dialog>
  );
}

/** Title, owner/due/priority/status fields, and the editable AI rationale. */
function ItemModalBody({ id }: { id: number }) {
  const patchItem = usePatchItem();
  const item = useItemQuery(id).data ?? null;

  // Text fields save on blur; selects/date save immediately — same optimistic write.
  const patch = (
    patchBody: Parameters<typeof patchItem.mutate>[0]["patch"],
  ) => {
    if (item) patchItem.mutate({ id: item.id, patch: patchBody });
  };

  if (!item) return null;

  return (
    // Keyed so defaultValue fields reset when a different item opens.
    <div key={item.id} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle className="text-[15px]">Edit action item</DialogTitle>
        <DialogDescription className="text-body">
          From “{item.meeting}”
          {item.completed ? ` · completed ${formatDate(item.completed)}` : ""}
        </DialogDescription>
      </DialogHeader>

      <label className="flex flex-col gap-[6px]">
        <span className={FIELD_LABEL}>Title</span>
        <Textarea
          defaultValue={item.title}
          onBlur={(e) => {
            if (e.target.value !== item.title) patch({ title: e.target.value });
          }}
          rows={2}
          className="block field-sizing-fixed min-h-[38px] w-full resize-none rounded-[11px] border-border bg-secondary px-[9px] py-[6px] text-[14px] leading-[1.35] font-semibold tracking-[-0.02em] text-foreground shadow-none md:text-[14px] dark:bg-secondary"
        />
      </label>

      <div className="grid grid-cols-2 gap-[10px]">
        <label className="flex min-w-0 flex-col gap-[6px]">
          <span className={FIELD_LABEL}>Owner</span>
          <Input
            defaultValue={item.owner}
            onBlur={(e) => {
              const owner = e.target.value.trim() || "Unassigned";
              if (owner !== item.owner) patch({ owner });
            }}
            className="h-8 rounded-control border-border bg-secondary px-2 text-body text-foreground shadow-none md:text-body dark:bg-secondary"
          />
        </label>
        <label className="flex min-w-0 flex-col gap-[6px]">
          <span className={FIELD_LABEL}>Due</span>
          <Input
            type="date"
            defaultValue={item.due}
            onBlur={(e) => {
              if (e.target.value !== item.due) patch({ due: e.target.value });
            }}
            className="h-8 rounded-control border-border bg-secondary px-2 text-body text-foreground shadow-none md:text-body dark:bg-secondary"
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
          className="block field-sizing-fixed w-full resize-none rounded-[11px] border-border bg-secondary px-[9px] py-[6px] text-body leading-[1.5] text-foreground shadow-none md:text-body dark:bg-secondary"
        />
      </label>

      <p className="text-[11.5px] text-muted-foreground">
        Edits save when you leave a field.
      </p>
    </div>
  );
}
