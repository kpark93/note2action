/** The infinite-scroll trigger: an invisible row at the bottom of a list that
 * asks for the next page when it scrolls into view. Leaf — no further calls. */
import { useEffect, useRef } from "react";

interface LoadMoreSentinelProps {
  /** Called when the sentinel becomes visible; the view guards it with
   * hasNextPage/isFetching before actually fetching. */
  onVisible: () => void;
  /** True while there is nothing further to load — unobserves entirely. */
  disabled: boolean;
  /** Shown while the next page is in flight. */
  loading: boolean;
}

/** IntersectionObserver-driven: purely event-based, no scroll math, no
 * timers. One subtlety: the observer only fires on visibility *transitions*,
 * so a sentinel that stays on screen after a short page loads would stall
 * the walk — the loading→idle effect below re-asks in that case, chaining
 * pages until the sentinel finally scrolls out of view or pages run out. */
export function LoadMoreSentinel({
  onVisible,
  disabled,
  loading,
}: LoadMoreSentinelProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Latest callback without re-creating the observer every render.
  const onVisibleRef = useRef(onVisible);
  onVisibleRef.current = onVisible;
  // Live visibility, updated on every transition in both directions.
  const intersectingRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;
    const observer = new IntersectionObserver((entries) => {
      intersectingRef.current = entries.some((entry) => entry.isIntersecting);
      if (intersectingRef.current) onVisibleRef.current();
    });
    observer.observe(el);
    return () => {
      intersectingRef.current = false;
      observer.disconnect();
    };
  }, [disabled]);

  useEffect(() => {
    // A page just settled (loading flipped false) with the sentinel still
    // visible: no intersection transition is coming — request the next page.
    if (!disabled && !loading && intersectingRef.current) {
      onVisibleRef.current();
    }
  }, [disabled, loading]);

  if (disabled) return null;
  return (
    <div ref={ref} className="flex justify-center py-3" aria-hidden="true">
      <span className="text-[12px] text-muted-foreground">
        {loading ? "Loading more…" : ""}
      </span>
    </div>
  );
}
