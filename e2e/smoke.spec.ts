import { test, expect, type Page } from '@playwright/test'

// 핵심 라우트가 콘솔 에러(하이드레이션 #418 등) 없이 뜨는지 검증하는 스모크.
// 공개 페이지는 항상, 로그인 페이지는 SMOKE_EMAIL/SMOKE_PASSWORD 가 있을 때만.

function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(e.message))
  return errors
}

const PUBLIC = ['/', '/news', '/textbook', '/notice', '/faq', '/auth/login', '/legal/terms']

for (const path of PUBLIC) {
  test(`public ${path} — 200 & no console errors`, async ({ page }) => {
    const errors = collectErrors(page)
    const res = await page.goto(path, { waitUntil: 'networkidle' })
    expect(res, `no response for ${path}`).toBeTruthy()
    expect(res!.status(), `status for ${path}`).toBeLessThan(400)
    expect(errors, `console errors on ${path}:\n${errors.join('\n')}`).toEqual([])
  })
}

const EMAIL = process.env.SMOKE_EMAIL
const PASSWORD = process.env.SMOKE_PASSWORD

test.describe('authenticated', () => {
  test.skip(!EMAIL || !PASSWORD, 'SMOKE_EMAIL/SMOKE_PASSWORD 미설정 — 로그인 스모크 건너뜀')

  test('study 도구 페이지들 — no console errors', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('이메일').fill(EMAIL!)
    await page.getByLabel('비밀번호').fill(PASSWORD!)
    await page.getByRole('button', { name: '로그인' }).click()
    await page.waitForURL('**/dashboard', { timeout: 15000 })

    const gated = [
      '/study/hygiene?mode=learn',
      '/study/search',
      '/study/review',
      '/study/stats',
      '/study/flashcards',
      '/study/planner',
      '/study/glossary',
      '/settings',
    ]
    for (const path of gated) {
      const errors = collectErrors(page)
      await page.goto(path, { waitUntil: 'networkidle' })
      expect(errors, `console errors on ${path}:\n${errors.join('\n')}`).toEqual([])
    }
  })
})
