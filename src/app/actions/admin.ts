'use server'

// 최고 관리자 변경 액션 — 모두 requireAdmin(권한) + service-role(RLS 우회) + 감사 로그.
// 클라이언트 폼/버튼에서 호출. 결과 { ok, error } 반환.

import { revalidatePath } from 'next/cache'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { isSupabaseConfigured } from '@/utils/supabase/config'
import { createAdminClient, isAdminConfigured } from '@/utils/supabase/admin'
import { isUserAdmin } from '@/lib/admin-access'
import { logAudit } from '@/lib/audit'

export interface AdminResult {
  ok: boolean
  error?: string
}

const ROLES = ['user', 'admin', 'superadmin']

type AuthOk = { ok: true; user: User }
type AuthFail = { ok: false; error: string }

async function requireAdmin(): Promise<AuthOk | AuthFail> {
  if (!isSupabaseConfigured() || !isAdminConfigured()) {
    return { ok: false, error: '관리자 기능이 비활성 상태입니다(Supabase/service-role 설정 필요).' }
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !(await isUserAdmin(supabase, user))) {
    return { ok: false, error: '권한이 없습니다. (관리자 전용)' }
  }
  return { ok: true, user }
}

export async function setUserRole(userId: string, role: string): Promise<AdminResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth
  if (!ROLES.includes(role)) return { ok: false, error: '잘못된 역할입니다.' }
  // 본인 역할 변경 전면 차단(자기 자신 강등/승급 모두 방지 — 권한 self-escalation 차단).
  if (userId === auth.user.id) {
    return { ok: false, error: '본인 권한은 변경할 수 없습니다.' }
  }
  const admin = createAdminClient()
  const { error } = await admin.from('profiles').update({ role }).eq('id', userId)
  if (error) return { ok: false, error: error.message }
  await logAudit({
    action: 'user.role_changed',
    targetType: 'profiles',
    targetId: userId,
    changes: { role },
  })
  revalidatePath('/admin/members')
  return { ok: true }
}

export async function grantEntitlement(userId: string): Promise<AdminResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth
  const admin = createAdminClient()
  const now = new Date().toISOString()
  const { error } = await admin.from('entitlements').upsert(
    {
      user_id: userId,
      status: 'active',
      access_until: null, // 무기한
      source: 'manual',
      granted_at: now,
      updated_at: now,
    },
    { onConflict: 'user_id' },
  )
  if (error) return { ok: false, error: error.message }
  await logAudit({
    action: 'entitlement.granted',
    targetType: 'entitlements',
    targetId: userId,
    changes: { status: 'active', source: 'manual' },
  })
  revalidatePath('/admin/members')
  revalidatePath('/admin/payments')
  revalidatePath('/admin') // 대시보드 활성 이용권 KPI
  revalidatePath('/admin/stats')
  return { ok: true }
}

export async function revokeEntitlement(userId: string): Promise<AdminResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth
  const admin = createAdminClient()
  const { error } = await admin
    .from('entitlements')
    .update({ status: 'none', updated_at: new Date().toISOString() })
    .eq('user_id', userId)
  if (error) return { ok: false, error: error.message }
  await logAudit({ action: 'entitlement.revoked', targetType: 'entitlements', targetId: userId })
  revalidatePath('/admin/members')
  revalidatePath('/admin/payments')
  revalidatePath('/admin') // 대시보드 활성 이용권 KPI
  revalidatePath('/admin/stats')
  return { ok: true }
}

export async function deleteMember(userId: string): Promise<AdminResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth
  if (userId === auth.user.id) return { ok: false, error: '본인 계정은 삭제할 수 없습니다.' }
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return { ok: false, error: error.message }
  await logAudit({ action: 'user.deleted', targetType: 'auth.users', targetId: userId })
  revalidatePath('/admin/members')
  revalidatePath('/admin') // 대시보드 회원 수 KPI
  return { ok: true }
}

// ── 공지 CMS ──
export async function saveNotice(
  _prev: AdminResult | null,
  formData: FormData,
): Promise<AdminResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth
  const idRaw = formData.get('id')
  const idNum = idRaw != null && idRaw !== '' ? Number(idRaw) : null
  const id = idNum != null && Number.isFinite(idNum) ? idNum : null
  const title = String(formData.get('title') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()
  const pinned = formData.get('pinned') === 'on'
  const published = formData.get('published') === 'on'
  if (!title || !body) return { ok: false, error: '제목과 내용을 입력하세요.' }

  const admin = createAdminClient()
  if (id !== null) {
    const { error } = await admin.from('notices').update({ title, body, pinned, published }).eq('id', id)
    if (error) return { ok: false, error: error.message }
    await logAudit({ action: 'notice.updated', targetType: 'notices', targetId: String(id) })
  } else {
    const { error } = await admin.from('notices').insert({ title, body, pinned, published })
    if (error) return { ok: false, error: error.message }
    await logAudit({ action: 'notice.created', targetType: 'notices' })
  }
  revalidatePath('/admin/notices')
  revalidatePath('/admin') // 대시보드 공지 KPI
  revalidatePath('/notice')
  return { ok: true }
}

export async function deleteNotice(id: number): Promise<AdminResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth
  const admin = createAdminClient()
  const { error } = await admin.from('notices').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  await logAudit({ action: 'notice.deleted', targetType: 'notices', targetId: String(id) })
  revalidatePath('/admin/notices')
  revalidatePath('/admin') // 대시보드 공지 KPI
  revalidatePath('/notice')
  return { ok: true }
}
