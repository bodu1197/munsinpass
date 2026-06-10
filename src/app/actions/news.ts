'use server'

// 뉴스 검토 액션 — 관리자만. service-role 로 status 갱신(RLS 우회).
// 권한: 로그인 사용자의 이메일이 ADMIN_EMAILS 에 포함되어야 함(이중 방어: proxy 의 /admin 게이트 + 여기).

import { revalidatePath, revalidateTag } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { isSupabaseConfigured } from '@/utils/supabase/config'
import { createAdminClient, isAdminConfigured, isAdminEmail } from '@/utils/supabase/admin'

async function assertAdmin(): Promise<boolean> {
  if (!isSupabaseConfigured() || !isAdminConfigured()) return false
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return isAdminEmail(user?.email)
}

export async function approveNews(formData: FormData): Promise<void> {
  const slug = String(formData.get('slug') ?? '').trim()
  if (!slug || !(await assertAdmin())) return
  const admin = createAdminClient()
  await admin
    .from('news_items')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('slug', slug)
    .eq('status', 'draft')
  revalidateTag('news', 'max')
  revalidatePath('/admin/news')
  revalidatePath('/news')
}

export async function rejectNews(formData: FormData): Promise<void> {
  const slug = String(formData.get('slug') ?? '').trim()
  if (!slug || !(await assertAdmin())) return
  const admin = createAdminClient()
  await admin.from('news_items').update({ status: 'rejected' }).eq('slug', slug).eq('status', 'draft')
  revalidatePath('/admin/news')
}
