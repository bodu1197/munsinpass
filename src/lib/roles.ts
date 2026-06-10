// 관리자 권한 판별 — 순수(서버 전용 의존 없음). proxy·페이지·서버액션 공용.
// 두 경로: (1) DB 역할 profiles.role, (2) ADMIN_EMAILS 환경변수 부트스트랩(소유자·초기 승급용).
// process.env.ADMIN_EMAILS 는 NEXT_PUBLIC_ 가 아니므로 서버에서만 값이 채워진다.

export type UserRole = 'user' | 'admin' | 'superadmin'

const ADMIN_ROLES: ReadonlySet<string> = new Set(['admin', 'superadmin'])

/** DB 역할이 관리자 등급인지 */
export function isAdminRole(role: string | null | undefined): boolean {
  return typeof role === 'string' && ADMIN_ROLES.has(role)
}

/** 이메일이 ADMIN_EMAILS(쉼표 구분) 부트스트랩 목록에 있는지 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const list = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(email.trim().toLowerCase())
}
