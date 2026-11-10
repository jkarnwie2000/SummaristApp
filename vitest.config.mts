import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Resolve the "@/..." imports from tsconfig.json.
    tsconfigPaths: true,
    alias: {
      // "server-only" throws outside a React Server environment; stub it for unit tests.
      "server-only": fileURLToPath(new URL("./__tests__/stubs/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["__tests__/**/*.test.{ts,tsx}"],
  },
});
