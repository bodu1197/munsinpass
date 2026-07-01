// 3일 지난 미승인(draft) 뉴스 자동 삭제 — 승인/반려 전에 원문 링크가 조용히 사라지는 사고를 막기 위해
// 삭제 건수·slug를 감사 로그에 남긴다. cron(collect-news)에서 호출.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/utils/supabase/types'
import { logAudit } from '@/lib/audit'
import { expiryCutoffISO } from './expiry'

export { DRAFT_EXPIRY_DAYS, daysUntilExpiry } from './expiry'

export interface CleanupResult {
  deleted: number
  error: string | null
}

export async function deleteExpiredDrafts(
  admin: SupabaseClient<Database>,
  expiryDays: number,
): Promise<CleanupResult> {
  const { data, error } = await admin
    .from('news_items')
    .delete()
    .eq('status', 'draft')
    .lt('created_at', expiryCutoffISO(expiryDays))
    .select('slug')

  if (error) return { deleted: 0, error: error.message }

  const deleted = data?.length ?? 0
  if (deleted > 0) {
    await logAudit({
      action: 'news.expired_deleted',
      targetType: 'news_items',
      changes: { count: deleted, expiryDays, slugs: data.map((r) => r.slug) },
    })
  }
  return { deleted, error: null }
}
