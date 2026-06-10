import { describe, it, expect } from 'vitest'
import { isEntitlementActive, PRICE_KRW } from './billing'

const NOW = 1_000_000_000_000 // 고정 기준 시각(ms)
const future = new Date(NOW + 86_400_000).toISOString()
const past = new Date(NOW - 86_400_000).toISOString()

describe('isEntitlementActive (무기한+자가신고)', () => {
  it("active + 만료일 없음(무기한) → 유효", () => {
    expect(isEntitlementActive('active', null, NOW)).toBe(true)
  })
  it('active + 미래 만료일 → 유효', () => {
    expect(isEntitlementActive('active', future, NOW)).toBe(true)
  })
  it('active + 과거 만료일 → 만료(비유효)', () => {
    expect(isEntitlementActive('active', past, NOW)).toBe(false)
  })
  it('none·self_closed 는 비유효', () => {
    expect(isEntitlementActive('none', null, NOW)).toBe(false)
    expect(isEntitlementActive('self_closed', null, NOW)).toBe(false)
    expect(isEntitlementActive('self_closed', future, NOW)).toBe(false)
  })
  it('잘못된 날짜 문자열은 fail-closed(비유효)', () => {
    expect(isEntitlementActive('active', 'not-a-date', NOW)).toBe(false)
  })
})

describe('PRICE_KRW', () => {
  it('23,000원 단일 출처', () => {
    expect(PRICE_KRW).toBe(23000)
  })
})
