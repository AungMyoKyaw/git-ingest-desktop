import { svelte } from "@sveltejs/vite-plugin-svelte";
import { svelteTesting } from "@testing-library/svelte/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [svelte(), svelteTesting()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html", "lcov"],
      reportsDirectory: "coverage/frontend",
      include: ["src/lib/**/*.ts", "src/lib/**/*.svelte", "src/App.svelte"],
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 }
    }
  }
});
