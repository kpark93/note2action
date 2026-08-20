/// <reference types="vite/client" />

// Typed env vars: `import.meta.env.VITE_…` is stringly-typed by default;
// declaring the ones we actually use catches typos at compile time.
interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
