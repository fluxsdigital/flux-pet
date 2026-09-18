import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testIgnore: ["**/unit/**", "**/integration/**"],
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3187",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 5"], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: "npm run start -- -p 3187",
    reuseExistingServer: false,
    timeout: 30_000,
    url: "http://127.0.0.1:3187",
  },
});
