import { useEffect, useState } from "react";
import { APP_NAME, type HealthResponse } from "@note2action/shared";

type State =
  | { status: "loading" }
  | { status: "ok"; data: HealthResponse }
  | { status: "error"; message: string };

export function App() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    fetch("/api/health")
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as HealthResponse;
      })
      .then((data) => setState({ status: "ok", data }))
      .catch((err: unknown) =>
        setState({
          status: "error",
          message: err instanceof Error ? err.message : String(err),
        }),
      );
  }, []);

  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: 640,
        margin: "4rem auto",
        padding: "0 1rem",
        lineHeight: 1.5,
      }}
    >
      <h1>{APP_NAME} — web</h1>
      <p>
        This page calls the API's <code>/api/health</code> endpoint through the
        Vite dev proxy.
      </p>
      <section
        style={{ padding: "1rem", border: "1px solid #ccc", borderRadius: 8 }}
      >
        {state.status === "loading" && <p>Checking API health…</p>}
        {state.status === "error" && (
          <p style={{ color: "crimson" }}>API unreachable: {state.message}</p>
        )}
        {state.status === "ok" && (
          <>
            <p style={{ color: "green", fontWeight: 600 }}>
              API is {state.data.status} ✅
            </p>
            <pre
              style={{
                background: "#f5f5f5",
                padding: "0.75rem",
                borderRadius: 6,
                overflowX: "auto",
              }}
            >
              {JSON.stringify(state.data, null, 2)}
            </pre>
          </>
        )}
      </section>
    </main>
  );
}
