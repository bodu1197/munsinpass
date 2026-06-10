import { defineConfig, devices } from '@playwright/test'

// 스모크 테스트 설정. 기본 대상은 프로덕션(배포 후 검증).
// 로컬 대상: BASE_URL=http://localhost:3000 npm run smoke
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: process.env.BASE_URL || 'https://munsinpass.vercel.app',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
