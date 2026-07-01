// 미승인(draft) 뉴스 만료 계산(순수 로직) — server-only 아님(테스트 가능).
// cron 삭제 쿼리의 cutoff와 관리자 UI D-day 배지가 같은 기준을 공유해 표시/삭제 기준이 벌어지지 않게 한다.

export const DRAFT_EXPIRY_DAYS = 3 // 미승인 draft 보관 기한(cron·관리자 UI 공통 단일 출처)
const DAY_MS = 86_400_000

export function expiryCutoffISO(expiryDays: number, now: number = Date.now()): string {
  return new Date(now - expiryDays * DAY_MS).toISOString()
}

export function daysUntilExpiry(createdAt: string, expiryDays: number, now: number = Date.now()): number {
  return expiryDays - Math.floor((now - new Date(createdAt).getTime()) / DAY_MS)
}
