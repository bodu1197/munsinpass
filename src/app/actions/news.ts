'use server'

// 뉴스 검토 액션 — 관리자만. service-role 로 status 갱신(RLS 우회).
// 권한: 로그인 사용자의 이메일이 ADMIN_EMAILS 에 포함되어야 함(이중 방어: proxy 의 /admin 게이트 + 여기).
// 단일 액션(intent=approve|reject) — useActionState 로 진행상태·에러를 한 곳에서 전달(조용한 실패/에러 혼동 방지).

import { revalidatePath, revalidateTag } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { isSupabaseConfigured } from '@/utils/supabase/config'
import { createAdminClient, isAdminConfigured } from '@/utils/supabase/admin'
import { isUserAdmin } from '@/lib/admin-access'
import { logAudit } from '@/lib/audit'

export interface NewsActionResult {
  ok: boolean
  error?: string
}

async function assertAdmin(): Promise<boolean> {
  if (!isSupabaseConfigured() || !isAdminConfigured()) return false
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return isUserAdmin(supabase, user)
}

export async function reviewNews(
  _prev: NewsActionResult | null,
  formData: FormData,
): Promise<NewsActionResult> {
  const slug = String(formData.get('slug') ?? '').trim()
  const intent = String(formData.get('intent') ?? '')
  if (!slug || (intent !== 'approve' && intent !== 'reject')) {
    return { ok: false, error: '잘못된 요청입니다.' }
  }
  if (!(await assertAdmin())) return { ok: false, error: '권한이 없습니다. (관리자 전용)' }

  const admin = createAdminClient()

  if (intent === 'approve') {
    // 원문 발행일 보존: 수집 시 저장된 published_at(RSS 원문일)을 유지, 없을 때만 승인 시각으로 대체
    const { data: row } = await admin
      .from('news_items')
      .select('published_at')
      .eq('slug', slug)
      .eq('status', 'draft')
      .maybeSingle()
    const publishedAt =
      (row as { published_at: string | null } | null)?.published_at ?? new Date().toISOString()

    const { error } = await admin
      .from('news_items')
      .update({ status: 'published', published_at: publishedAt })
      .eq('slug', slug)
      .eq('status', 'draft')
    if (error) return { ok: false, error: `게시 실패: ${error.message}` }

    await logAudit({
      action: 'news.approved',
      targetType: 'news_items',
      targetId: slug,
      changes: { status: { old: 'draft', new: 'published' } },
    })
    revalidateTag('news', 'max')
    revalidatePath('/admin/news')
    revalidatePath('/news')
    return { ok: true }
  }

  // reject
  const { error } = await admin
    .from('news_items')
    .update({ status: 'rejected' })
    .eq('slug', slug)
    .eq('status', 'draft')
  if (error) return { ok: false, error: `반려 실패: ${error.message}` }

  await logAudit({
    action: 'news.rejected',
    targetType: 'news_items',
    targetId: slug,
    changes: { status: { old: 'draft', new: 'rejected' } },
  })
  revalidatePath('/admin/news')
  return { ok: true }
}
