import { useQuery } from "@tanstack/react-query";
import { APP_NAME, type HealthResponse } from "@note2action/shared";

export function App() {
  const { data, status, error } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await fetch("/api/health");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as HealthResponse;
    },
  });

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
        {status === "pending" && <p>Checking API health…</p>}
        {status === "error" && (
          <p style={{ color: "crimson" }}>
            API unreachable: {error instanceof Error ? error.message : String(error)}
          </p>
        )}
        {status === "success" && data && (
          <>
            <p style={{ color: "green", fontWeight: 600 }}>
              API is {data.status} ✅
            </p>
            <pre
              style={{
                background: "#f5f5f5",
                padding: "0.75rem",
                borderRadius: 6,
                overflowX: "auto",
              }}
            >
              {JSON.stringify(data, null, 2)}
            </pre>
          </>
        )}
      </section>
    </main>
  );
}
