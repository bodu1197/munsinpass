import { describe, it, expect, beforeEach } from 'vitest'
import { rateLimit, __resetRateLimit, __rateLimitSize, type RateLimitRule } from './rate-limit'

const RULE: RateLimitRule = { windowMs: 1000, max: 3 }

describe('rateLimit (인메모리 슬라이딩 윈도우)', () => {
  beforeEach(() => __resetRateLimit())

  it('윈도우 내 max 까지 허용하고 그 다음을 차단', () => {
    expect(rateLimit('a', RULE, 0).ok).toBe(true)
    expect(rateLimit('a', RULE, 100).ok).toBe(true)
    expect(rateLimit('a', RULE, 200).ok).toBe(true)
    expect(rateLimit('a', RULE, 300).ok).toBe(false) // 4번째 = 차단
  })

  it('윈도우가 지나면(가장 오래된 항목 만료) 다시 허용', () => {
    rateLimit('b', RULE, 0)
    rateLimit('b', RULE, 0)
    rateLimit('b', RULE, 0)
    expect(rateLimit('b', RULE, 0).ok).toBe(false)
    expect(rateLimit('b', RULE, 1001).ok).toBe(true) // 첫 항목(t=0) 만료
  })

  it('키별로 독립적으로 카운트', () => {
    rateLimit('x', RULE, 0)
    rateLimit('x', RULE, 0)
    rateLimit('x', RULE, 0)
    expect(rateLimit('x', RULE, 0).ok).toBe(false)
    expect(rateLimit('y', RULE, 0).ok).toBe(true) // 다른 키는 영향 없음
  })

  it('차단 시 retryAfterMs 를 다음 슬롯까지 남은 시간으로 보고', () => {
    rateLimit('c', RULE, 0) // 가장 오래된 = t0
    rateLimit('c', RULE, 0)
    rateLimit('c', RULE, 0)
    const r = rateLimit('c', RULE, 500)
    expect(r.ok).toBe(false)
    expect(r.retryAfterMs).toBe(500) // windowMs(1000) - (500 - 0)
  })

  it('store가 5000을 넘으면 prune이 만료 키만 정리(활성 키 보존)', () => {
    for (let i = 0; i < 5001; i++) rateLimit(`k${i}`, RULE, 0) // 5001개, 모두 t=0
    expect(__rateLimitSize()).toBe(5001) // now=0 이라 아직 만료 전 → prune이 지우지 않음
    // 윈도우(1000ms) 경과 시점에 새 키 추가 → prune 트리거, t=0 키 전부 만료 삭제
    rateLimit('fresh', RULE, 2000)
    expect(__rateLimitSize()).toBe(1) // 만료된 5001개 삭제, 'fresh'만 잔존
  })
})
