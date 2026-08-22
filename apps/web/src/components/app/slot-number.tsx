// Animated percentage display used by CompletionCard's headline figure.
// Path: completion-card.tsx → [this file] (leaf — pure presentation).
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * Slot-machine percentage: each digit is a 0-9 reel that transitions to
 * the new value — rolling up when the number grows, down when it shrinks.
 */
export function SlotNumber({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const digits = String(clamped).split("");
  return (
    <span
      className="inline-flex items-center"
      style={{ height: "1em", lineHeight: 1 }}
      aria-label={`${clamped}%`}
    >
      {digits.map((d, i) => (
        // Key from the right so lower places keep their reel across carries.
        <SlotDigit key={digits.length - 1 - i} digit={Number(d)} />
      ))}
      <span
        aria-hidden="true"
        style={{ display: "flex", height: "1em", alignItems: "center" }}
      >
        %
      </span>
    </span>
  );
}

function SlotDigit({ digit }: { digit: number }) {
  return (
    <span
      aria-hidden="true"
      style={{ display: "block", height: "1em", overflow: "hidden" }}
    >
      <span
        style={{
          display: "flex",
          flexDirection: "column",
          transform: `translateY(-${digit}em)`,
          transition: "transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {DIGITS.map((n) => (
          <span
            key={n}
            style={{
              display: "flex",
              height: "1em",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}
