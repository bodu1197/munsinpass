// 관리자 작업 감사 로그 — 서버 전용. service-role 로 audit_logs 에 기록(RLS 우회).
// 방어적: 미설정/테이블 미존재/오류 시 조용히 건너뜀(감사 실패가 본 작업을 막지 않음).

import 'server-only'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient, isAdminConfigured } from '@/utils/supabase/admin'

export interface AuditEntry {
  action: string // 'news.approved' 등
  targetType?: string
  targetId?: string
  changes?: Record<string, unknown>
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    if (!isAdminConfigured()) return
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const admin = createAdminClient()
    await admin.from('audit_logs').insert({
      actor_id: user?.id ?? null,
      actor_email: user?.email ?? null,
      action: entry.action,
      target_type: entry.targetType ?? null,
      target_id: entry.targetId ?? null,
      changes: entry.changes ?? null,
    })
  } catch (e) {
    // 감사 로그 실패는 본 작업을 막지 않음(테이블 미존재·오설정 등).
    // 단, 운영자가 누락을 감지하도록 로그는 남긴다.
    console.error('[audit] logAudit 실패:', e instanceof Error ? e.message : e)
  }
}
