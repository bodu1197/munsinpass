// 서버 측 관리자 여부 판정(이메일 부트스트랩 OR DB 역할). proxy·페이지·액션 공용.
// 방어적: profiles.role 컬럼이 아직 없으면(마이그레이션 전) 이메일 부트스트랩만으로 동작.
// ⚠️ 부트스트랩(ADMIN_EMAILS)이 DB 역할보다 우선 — 이메일 일치 시 DB 조회 없이 즉시 관리자(소유자 비상 접근).

import 'server-only' // 서버 전용(클라 오import 방지 fail-safe)
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from '@/utils/supabase/types'
import { isAdminEmail, isAdminRole } from './roles'

/**
 * 주어진(사용자 세션) Supabase 클라이언트로 관리자 여부를 판정.
 * @param supabase 사용자 세션 클라이언트(본인 profiles 조회는 RLS 본인 정책으로 허용됨)
 */
export async function isUserAdmin(
  supabase: SupabaseClient<Database>,
  user: Pick<User, 'id' | 'email'> | null | undefined,
): Promise<boolean> {
  if (!user) return false
  if (isAdminEmail(user.email)) return true // 부트스트랩(DB 조회 없이 소유자 통과)
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (error) return false // role 컬럼 미존재/조회 실패 → 비관리자 취급
  return isAdminRole(data?.role)
}
