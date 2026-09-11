/** Root layout — only page.tsx renders through it; API routes skip React layouts. */
import type { ReactNode } from "react";

export const metadata = {
  title: "note2action — AI",
  description: "AI features for note2action, powered by the Vercel AI SDK.",
};

/** Bare HTML shell (no nav, no shared chrome) around whichever page renders. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
