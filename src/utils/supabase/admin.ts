// service-role Supabase 클라이언트 — **서버 전용**.
// RLS 를 우회하므로 cron 수집/관리자 승인에서만 사용한다.
// SUPABASE_SERVICE_ROLE_KEY 는 NEXT_PUBLIC_ 접두사가 없어 클라이언트 번들에 포함되지 않는다.
// (클라이언트 컴포넌트에서 import 금지)

import 'server-only' // 클라이언트 번들에 import 되면 빌드 에러로 막는 fail-safe
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

const URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()

/** service-role 쓰기(수집/승인)가 가능한 상태인지 */
export function isAdminConfigured(): boolean {
  if (!URL || !SERVICE_KEY) return false
  if (SERVICE_KEY.includes('your-')) return false
  return /^https?:\/\//.test(URL)
}

/** RLS 우회 클라이언트. 미설정 시 throw — 호출 전 isAdminConfigured() 로 가드할 것. */
export function createAdminClient(): SupabaseClient<Database> {
  if (!isAdminConfigured()) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY 미설정 — service-role 작업 불가')
  }
  return createClient<Database>(URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** 쉼표로 구분된 ADMIN_EMAILS 중 하나인지(뉴스 검토 권한) */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const list = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(email.trim().toLowerCase())
}
