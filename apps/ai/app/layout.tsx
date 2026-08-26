// Next.js root layout for the ai app — wraps every page/route under app/.
// Only page.tsx (the chat demo) renders through this; the API routes
// (api/extract, api/chat) don't use React layouts.
// Path: apps/ai app router → [this file] → app/page.tsx.
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
