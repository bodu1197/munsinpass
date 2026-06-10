// 베스트-에포트 인메모리 슬라이딩 윈도우 레이트리밋.
// ⚠️ 서버리스 주의: 인스턴스별 메모리라 콜드스타트/멀티인스턴스 간 공유되지 않는다.
//    1차 방어선은 "인증"(로그인 필수)이고, 이건 비용 폭주를 막는 2차 버스트 가드다.
//    (외부 KV/Redis 의존성 없이 동작하도록 의도적으로 in-memory.)
//
// srs.computeReview 와 동일하게 now 를 주입받아 순수 함수로 테스트 가능하게 한다.

export interface RateLimitRule {
  /** 윈도우 길이(ms) */
  windowMs: number
  /** 윈도우 내 허용 요청 수 */
  max: number
}

export interface RateLimitResult {
  /** 허용 여부 (true = 통과) */
  ok: boolean
  /** 차단 시 다음 슬롯까지 남은 시간(ms). 통과 시 0 */
  retryAfterMs: number
}

const store = new Map<string, number[]>()

/**
 * key 단위로 windowMs 동안 max 회까지 허용. 초과 시 ok:false.
 * @param now 현재 시각(ms). 호출부에서 Date.now() 주입(테스트는 고정값 주입).
 */
export function rateLimit(
  key: string,
  rule: RateLimitRule,
  now: number = Date.now(),
): RateLimitResult {
  const recent = (store.get(key) ?? []).filter((t) => now - t < rule.windowMs)

  if (recent.length >= rule.max) {
    store.set(key, recent)
    const oldest = recent[0]
    return { ok: false, retryAfterMs: Math.max(0, rule.windowMs - (now - oldest)) }
  }

  recent.push(now)
  store.set(key, recent)

  // 메모리 누수 방지: 맵이 비대해지면 만료된 키 정리(현재 윈도우 기준 coarse GC).
  // 5000 = 보수적 상한(키당 number[] 수개 → 수백 KB 수준). 활성 키는 보존하므로 정확도 영향 없음.
  if (store.size > 5000) prune(now, rule.windowMs)

  return { ok: true, retryAfterMs: 0 }
}

function prune(now: number, windowMs: number): void {
  for (const [k, v] of store) {
    if (v.length === 0 || now - v[v.length - 1] >= windowMs) store.delete(k)
  }
}

/** 테스트 전용: 내부 상태 초기화 */
export function __resetRateLimit(): void {
  store.clear()
}

/** 테스트 전용: 내부 맵 크기(prune 검증용) */
export function __rateLimitSize(): number {
  return store.size
}
