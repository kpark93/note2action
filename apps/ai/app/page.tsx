"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { APP_NAME } from "@note2action/shared";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat();

  const busy = status === "submitted" || status === "streaming";

  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: 640,
        margin: "3rem auto",
        padding: "0 1rem",
        lineHeight: 1.5,
      }}
    >
      <h1>{APP_NAME} — AI</h1>
      <p>
        Minimal streamed chat using the Vercel AI SDK v6 (<code>useChat</code> +{" "}
        <code>streamText</code>).
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          margin: "1.5rem 0",
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: "#777" }}>Ask something to get started…</p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              padding: "0.75rem",
              border: "1px solid #ddd",
              borderRadius: 8,
            }}
          >
            <strong>{message.role === "user" ? "You" : "Assistant"}</strong>
            <div style={{ whiteSpace: "pre-wrap" }}>
              {message.parts.map((part, i) =>
                part.type === "text" ? <span key={i}>{part.text}</span> : null,
              )}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim() || busy) return;
          sendMessage({ text: input });
          setInput("");
        }}
        style={{ display: "flex", gap: "0.5rem" }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          style={{
            flex: 1,
            padding: "0.6rem",
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />
        <button
          type="submit"
          disabled={busy}
          style={{ padding: "0.6rem 1rem", borderRadius: 6 }}
        >
          {busy ? "…" : "Send"}
        </button>
      </form>
    </main>
  );
}
