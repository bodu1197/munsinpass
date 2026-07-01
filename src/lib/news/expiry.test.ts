import { describe, it, expect } from 'vitest'
import { daysUntilExpiry, expiryCutoffISO } from './expiry'

const NOW = 1_000_000_000_000 // 고정 기준 시각(ms)

describe('daysUntilExpiry', () => {
  it('방금 생성 → 만료일 그대로 남음', () => {
    expect(daysUntilExpiry(new Date(NOW).toISOString(), 3, NOW)).toBe(3)
  })
  it('2일 경과 → 1일 남음', () => {
    expect(daysUntilExpiry(new Date(NOW - 2 * 86_400_000).toISOString(), 3, NOW)).toBe(1)
  })
  it('3일 경과 → 오늘 삭제 대상(0)', () => {
    expect(daysUntilExpiry(new Date(NOW - 3 * 86_400_000).toISOString(), 3, NOW)).toBe(0)
  })
  it('4일 경과 → 이미 삭제 기준 지남(음수)', () => {
    expect(daysUntilExpiry(new Date(NOW - 4 * 86_400_000).toISOString(), 3, NOW)).toBe(-1)
  })
})

describe('expiryCutoffISO', () => {
  it('N일 전 시각을 ISO 문자열로 반환', () => {
    expect(expiryCutoffISO(3, NOW)).toBe(new Date(NOW - 3 * 86_400_000).toISOString())
  })
})
