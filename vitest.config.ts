import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// 단위 테스트(순수 로직). e2e(playwright)는 npm run smoke 로 별도 실행.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
