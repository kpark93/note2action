import type { ReactNode } from "react";

export const metadata = {
  title: "note2action — AI",
  description: "AI features for note2action, powered by the Vercel AI SDK.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
