/** One item's editable card in the Review grid — every edit is an optimistic
 * write. Next hop: usePatchItem / useDeleteItem. */
import type { CSSProperties } from "react";
import { useDeleteItem, usePatchItem } from "@/domain/items/items.queries";
import { OWNERS } from "@/domain/items/items.constants";
import type { Priority } from "@/domain/items/items.types";
import type { ReviewItemVM } from "@/views/review/review.utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Title, owner/due/priority fields, AI rationale, discard. */
export function ReviewCard({ item }: { item: ReviewItemVM }) {
  // Both mutations are OPTIMISTIC: edits show immediately, then PATCH/
  // DELETE confirms — rollback + toast on failure. (request-paths.md §2)
  const patchItem = usePatchItem();
  const deleteItem = useDeleteItem();

  // Text fields save on blur (one PATCH per edit, not per keystroke);
  // selects and buttons save immediately.
  const patch = (patchBody: Parameters<typeof patchItem.mutate>[0]["patch"]) =>
    patchItem.mutate({ id: item.id, patch: patchBody });

  return (
    <article
      className="review-card n2a-card rounded-[16px] border border-border bg-card px-[13px] py-3"
      style={
        {
          animationDelay: item.delay,
          "--hover-shadow": "0 12px 30px hsl(0 0% 0% / 0.35)",
          "--hover-border": "hsl(var(--foreground) / 0.18)",
        } as CSSProperties
      }
    >
      <div className="mb-[9px] flex items-center">
        <span className="ml-auto min-w-0 overflow-hidden text-[11.5px] text-ellipsis whitespace-nowrap text-muted-foreground">
          {item.meeting}
        </span>
      </div>

      <Textarea
        defaultValue={item.title}
        onBlur={(e) => {
          if (e.target.value !== item.title) patch({ title: e.target.value });
        }}
        rows={2}
        className="review-title mb-[9px] block field-sizing-fixed min-h-[38px] w-full resize-none overflow-hidden rounded-[11px] border-transparent bg-transparent px-[7px] py-[5px] text-[14.5px] leading-[1.35] font-semibold tracking-[-0.02em] text-foreground shadow-none md:text-[14.5px] dark:bg-transparent"
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-[9px]">
        <label className="flex flex-col gap-[6px]">
          <span className="text-[11px] font-medium text-muted-foreground">
            Owner
          </span>
          <Select value={item.owner} onValueChange={(v) => patch({ owner: v })}>
            <SelectTrigger className="w-full rounded-[10px] border-border bg-secondary px-2 text-[12.5px] text-foreground data-[size=default]:h-8">
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
        <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-[9px]">
          <label className="flex min-w-0 flex-col gap-[6px]">
            <span className="text-[11px] font-medium text-muted-foreground">
              Due
            </span>
            <Input
              type="date"
              defaultValue={item.due}
              onBlur={(e) => {
                if (e.target.value !== item.due) patch({ due: e.target.value });
              }}
              className="h-8 rounded-[10px] border-border bg-secondary px-2 text-[12.5px] text-foreground shadow-none md:text-[12.5px] dark:bg-secondary"
            />
          </label>
          <label className="flex min-w-0 flex-col gap-[6px]">
            <span className="text-[11px] font-medium text-muted-foreground">
              Priority
            </span>
            <Select
              value={item.priority}
              onValueChange={(v) => patch({ priority: v as Priority })}
            >
              <SelectTrigger className="w-full rounded-[10px] border-border bg-secondary px-2 text-[12.5px] text-foreground data-[size=default]:h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </div>
      </div>

      <div className="mt-[11px] flex items-center gap-[10px] border-t border-border pt-[10px]">
        <span className="min-w-0 flex-1 text-[12.5px] leading-[1.5] text-muted-foreground">
          {item.note}
        </span>
        <Button
          variant="outline"
          onClick={() => deleteItem.mutate(item.id)}
          className="h-[29px] w-[82px] flex-none rounded-[9px] border-border bg-transparent px-0 text-[12.5px] font-medium text-muted-foreground shadow-none dark:border-border dark:bg-transparent"
        >
          Discard
        </Button>
      </div>
    </article>
  );
}
