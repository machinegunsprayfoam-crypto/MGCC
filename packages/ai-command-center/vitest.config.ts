import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Resolve @mgcc workspace deps to their TypeScript source so tests run without
// building the dependency packages first (keeps `pnpm -r test` green in fresh
// sessions). The build (tsconfig.build.json) resolves to dist instead.
const src = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@mgcc/grants": src("../grants/src/index.ts"),
      "@mgcc/mcp-connector": src("../mcp-connector/src/index.ts"),
      "@mgcc/anthropic-backends": src("../anthropic-backends/src/index.ts"),
      "@mgcc/shared": src("../shared/src/index.ts"),
    },
  },
});
