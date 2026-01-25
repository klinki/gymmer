import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    screenshot: process.env.SCREENSHOTS ? 'on' : 'only-on-failure',
    baseURL: 'http://localhost:4201',
  },
  projects: [
    {
      name: 'Desktop',
      use: {
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'Mobile',
      use: {
        ...devices['Pixel 7'],
      },
    },
  ],
  webServer: {
    command: 'ng serve --port 4201',
    url: 'http://localhost:4201',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
