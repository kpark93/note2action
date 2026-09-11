/** Infinite-scroll trigger: asks for the next page when it scrolls into view. */
import { useEffect, useRef } from "react";

interface LoadMoreSentinelProps {
  /** Called when visible; the view guards with hasNextPage/isFetching. */
  onVisible: () => void;
  /** True while there is nothing further to load — unobserves entirely. */
  disabled: boolean;
  /** Shown while the next page is in flight. */
  loading: boolean;
}

/** IntersectionObserver-driven; the loading→idle effect re-asks when a short page settles. */
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
    // A page settled with the sentinel still visible: no transition is coming — re-ask.
    if (!disabled && !loading && intersectingRef.current) {
      onVisibleRef.current();
    }
  }, [disabled, loading]);

  if (disabled) return null;
  return (
    <div ref={ref} className="flex justify-center py-3" aria-hidden="true">
      <span className="text-meta text-muted-foreground">
        {loading ? "Loading more…" : ""}
      </span>
    </div>
  );
}
