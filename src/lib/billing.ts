// 결제 상수 + 이용권 판정(순수) — 가격 페이지·서버 결제검증·이용권 게이트의 단일 출처.
// ⚠️ server-only 아님(테스트 가능). 가격은 여기 한 곳에서만 정의 → 클라 표시와 서버 검증 금액이 절대 어긋나지 않게.

export const PRICE_KRW = 23000
export const ORDER_NAME = '문신패스 이용권 (합격까지)'
export const CURRENCY = 'KRW' as const

export type EntitlementStatus = 'none' | 'active' | 'self_closed'

/**
 * 이용권 유효 여부(순수). 무기한+자가신고 모델:
 * status='active' 이고, 만료일(access_until)이 없으면 무기한 유효, 있으면 미경과 시 유효.
 * @param now 현재 시각(ms) — srs/rate-limit 과 동일하게 주입형(테스트 고정값).
 */
export function isEntitlementActive(
  status: EntitlementStatus,
  accessUntil: string | null,
  now: number = Date.now(),
): boolean {
  if (status !== 'active') return false
  if (!accessUntil) return true // 무기한
  const until = new Date(accessUntil).getTime()
  return Number.isFinite(until) && until > now // 잘못된 날짜는 fail-closed
}
