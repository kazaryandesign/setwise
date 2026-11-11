import { defineConfig, devices } from '@playwright/test';

// iPhone viewport + touch on Chromium (WebKit isn't installed in CI images by default).
const iphone = { ...devices['iPhone 14'], browserName: 'chromium' as const, defaultBrowserType: undefined };

export default defineConfig({
  testDir: 'e2e',
  timeout: 120_000,
  use: {
    ...iphone,
    baseURL: 'http://localhost:4173',
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 120_000
  }
});
