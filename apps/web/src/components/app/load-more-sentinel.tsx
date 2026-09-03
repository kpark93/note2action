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
 * timers. The observer re-fires whenever the sentinel re-enters the
 * viewport, so a short first page keeps loading until it fills the screen. */
export function LoadMoreSentinel({
  onVisible,
  disabled,
  loading,
}: LoadMoreSentinelProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Latest callback without re-creating the observer every render.
  const onVisibleRef = useRef(onVisible);
  onVisibleRef.current = onVisible;

  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        onVisibleRef.current();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [disabled]);

  if (disabled) return null;
  return (
    <div ref={ref} className="flex justify-center py-3" aria-hidden="true">
      <span className="text-[12px] text-muted-foreground">
        {loading ? "Loading more…" : ""}
      </span>
    </div>
  );
}
