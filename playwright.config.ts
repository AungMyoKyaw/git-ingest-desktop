import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./visual-tests",
  forbidOnly: true,
  workers: 1,
  use: { baseURL: "http://127.0.0.1:1420", browserName: "chromium", colorScheme: "light" },
  webServer: { command: "bun run dev -- --host 127.0.0.1", url: "http://127.0.0.1:1420", reuseExistingServer: !process.env.CI, timeout: 120000 }
});
