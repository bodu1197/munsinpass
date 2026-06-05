// Supabase 환경변수 검증 + 안전한 기본값.
// 미설정/플레이스홀더 상태에서도 앱이 죽지 않고 "게스트/데모 모드"로 동작하게 합니다.

const PLACEHOLDERS = new Set([
  '',
  'your-supabase-url',
  'your-supabase-anon-key',
  'placeholder',
  'placeholder-anon-key',
  'https://placeholder.supabase.co',
])

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

/** Supabase 인증/DB 기능을 실제로 사용할 수 있는 상태인지 */
export function isSupabaseConfigured(): boolean {
  if (!rawUrl || !rawKey) return false
  if (PLACEHOLDERS.has(rawUrl) || PLACEHOLDERS.has(rawKey)) return false
  return isValidHttpUrl(rawUrl)
}

// 클라이언트 생성자(createServerClient/createBrowserClient)가 throw 하지 않도록
// 항상 "문법적으로 유효한" 값을 제공합니다. 실제 사용 여부는 isSupabaseConfigured() 로 가드.
export const SUPABASE_URL = isValidHttpUrl(rawUrl) ? rawUrl : 'https://placeholder.supabase.co'
export const SUPABASE_ANON_KEY = rawKey || 'placeholder-anon-key'
