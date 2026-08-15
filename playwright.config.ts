import { defineConfig, devices } from "@playwright/test"

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
  projects: [
    // devices["Desktop Chrome"] carries its own fixed 1280x720 viewport, which
    // would silently override the `viewport: null` above — re-null it here so
    // the page actually fills the maximized window instead of a small fixed area.
    { name: "chromium", use: { ...devices["Desktop Chrome"], viewport: null } },
  ],
})
