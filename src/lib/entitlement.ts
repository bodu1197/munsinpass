// 이용권(접근권) 조회 — 서버 전용. proxy(Phase 3)·페이지·액션 공용.
// 판정 로직(순수)·상수는 src/lib/billing.ts. 여기서는 DB 조회 + fail-closed 만 담당.
// ⚠️ entitlements 테이블이 아직 없거나 조회 실패 시 비활성으로 간주(fail-closed).

import 'server-only'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from '@/utils/supabase/types'
import { isEntitlementActive, type EntitlementStatus } from './billing'

export interface EntitlementState {
  /** 플랫폼 이용 가능 여부 */
  active: boolean
  status: EntitlementStatus
  /** 만료일(ISO) — NULL/없음이면 무기한 */
  accessUntil: string | null
}

const NONE: EntitlementState = { active: false, status: 'none', accessUntil: null }

export async function getEntitlement(
  supabase: SupabaseClient<Database>,
  user: Pick<User, 'id'> | null | undefined,
): Promise<EntitlementState> {
  if (!user) return NONE
  const { data, error } = await supabase
    .from('entitlements')
    .select('status,access_until')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error || !data) return NONE
  return {
    active: isEntitlementActive(data.status, data.access_until),
    status: data.status,
    accessUntil: data.access_until,
  }
}
