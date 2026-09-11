/// <reference types="vite/client" />

// Typed env vars: declaring the ones we use catches typos at compile time.
interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
