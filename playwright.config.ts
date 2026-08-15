import { defineConfig } from "@playwright/test"

// This suite is a recording aid, not a CI gate: one visible, real browser window
// walks through the product so you can screen-record it. Run `npm run dev` first,
// start your screen recorder, then `npm run demo`.
export default defineConfig({
  testDir: "./tests",
  timeout: 5 * 60 * 1000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    headless: false,
    viewport: null,
    launchOptions: {
      args: ["--start-maximized"],
    },
  },
  // No devices["Desktop Chrome"] preset here — it carries its own fixed
  // viewport + deviceScaleFactor, both of which conflict with the plain
  // `viewport: null` above. Plain chromium picks up everything from `use`.
  projects: [{ name: "chromium" }],
})
