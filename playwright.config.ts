import { defineConfig, devices } from '@playwright/test'

// Uji berjalan terhadap build produksi (service worker hanya aktif di build).
export default defineConfig({
  testDir: 'e2e',
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  use: { baseURL: 'http://localhost:4173' },
  projects: [{ name: 'android', use: { ...devices['Pixel 5'] } }],
})
