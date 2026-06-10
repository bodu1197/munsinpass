// 관리자 대시보드 데이터 — 서버 전용(service-role, RLS 우회).
// ⚠️ 방어적: 마이그레이션 미적용(테이블/컬럼 부재)·오류 시 빈 값 + degraded 라벨 반환 → 화면이 깨지지 않음.

import 'server-only'
import { createAdminClient, isAdminConfigured } from '@/utils/supabase/admin'

type CountQuery = () => PromiseLike<{ count: number | null; error: unknown }>

async function countRows(run: CountQuery, degraded: string[], label: string): Promise<number> {
  try {
    const { count, error } = await run()
    if (error) {
      degraded.push(label)
      return 0
    }
    return count ?? 0
  } catch {
    degraded.push(label)
    return 0
  }
}

const LIST_LIMIT = 300 // 관리자 목록 1회 조회 상한(UI/성능). 초과 시 검색·페이지네이션 사용.

// PostgREST .or() 필터 인젝션 방지: 필터 구문 특수문자 제거 + 길이 제한.
// , ( ) → 조건 구분/그룹, % * → 와일드카드, ; : ' ` \ → 기타 구문 문자. (이메일의 . @ - _ 는 보존)
function sanitizeQuery(q: string): string {
  return q.replace(/[,()%*\\;:'`]/g, '').trim().slice(0, 60)
}

export interface AdminKpis {
  totalMembers: number
  newMembers7d: number
  activeEntitlements: number
  newsPending: number
  noticeCount: number
  totalAnswers: number
  /** 집계 실패 라벨(마이그레이션 미적용 등) — 비어있지 않으면 화면에 안내 배너 */
  degraded: string[]
}

export async function getAdminKpis(): Promise<AdminKpis> {
  const degraded: string[] = []
  const kpis: AdminKpis = {
    totalMembers: 0,
    newMembers7d: 0,
    activeEntitlements: 0,
    newsPending: 0,
    noticeCount: 0,
    totalAnswers: 0,
    degraded,
  }
  if (!isAdminConfigured()) {
    degraded.push('service-role 미설정')
    return kpis
  }
  const admin = createAdminClient()
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()

  // 6개 독립 count 를 병렬 실행(순차 대비 지연 단축). degraded.push 는 단일 스레드라 안전.
  const [totalMembers, newMembers7d, activeEntitlements, newsPending, noticeCount, totalAnswers] =
    await Promise.all([
      countRows(() => admin.from('profiles').select('*', { count: 'exact', head: true }), degraded, '회원 수'),
      countRows(
        () => admin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
        degraded, '신규 회원',
      ),
      countRows(
        () => admin.from('entitlements').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        degraded, '활성 이용권(0004 적용 필요)',
      ),
      countRows(
        () => admin.from('news_items').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
        degraded, '뉴스 검토대기',
      ),
      countRows(() => admin.from('notices').select('*', { count: 'exact', head: true }), degraded, '공지(0005 적용 필요)'),
      countRows(() => admin.from('user_answers').select('*', { count: 'exact', head: true }), degraded, '누적 풀이'),
    ])

  kpis.totalMembers = totalMembers
  kpis.newMembers7d = newMembers7d
  kpis.activeEntitlements = activeEntitlements
  kpis.newsPending = newsPending
  kpis.noticeCount = noticeCount
  kpis.totalAnswers = totalAnswers
  return kpis
}

export interface MemberRow {
  id: string
  email: string | null
  nickname: string | null
  role: string
  createdAt: string
  entitlementStatus: string | null
  accessUntil: string | null
}

export async function listMembers(query?: string): Promise<{ rows: MemberRow[]; degraded: boolean }> {
  if (!isAdminConfigured()) return { rows: [], degraded: true }
  const admin = createAdminClient()
  try {
    let q = admin
      .from('profiles')
      .select('id,email,nickname,role,created_at')
      .order('created_at', { ascending: false })
      .limit(LIST_LIMIT)
    const term = query ? sanitizeQuery(query) : ''
    if (term) q = q.or(`email.ilike.%${term}%,nickname.ilike.%${term}%`)
    const { data: profiles, error } = await q
    if (error) return { rows: [], degraded: true }

    const ids = (profiles ?? []).map((p) => p.id)
    const ent = new Map<string, { status: string; access_until: string | null }>()
    if (ids.length) {
      const { data: ents } = await admin
        .from('entitlements')
        .select('user_id,status,access_until')
        .in('user_id', ids)
      for (const e of ents ?? []) ent.set(e.user_id, { status: e.status, access_until: e.access_until })
    }
    const rows: MemberRow[] = (profiles ?? []).map((p) => ({
      id: p.id,
      email: p.email,
      nickname: p.nickname,
      role: p.role,
      createdAt: p.created_at,
      entitlementStatus: ent.get(p.id)?.status ?? null,
      accessUntil: ent.get(p.id)?.access_until ?? null,
    }))
    return { rows, degraded: false }
  } catch {
    return { rows: [], degraded: true }
  }
}

export interface PaymentRow {
  id: number
  userId: string
  email: string | null
  paymentId: string
  amount: number
  status: string
  provider: string
  createdAt: string
}

export async function listPayments(): Promise<{ rows: PaymentRow[]; revenue: number; degraded: boolean }> {
  if (!isAdminConfigured()) return { rows: [], revenue: 0, degraded: true }
  const admin = createAdminClient()
  try {
    const { data, error } = await admin
      .from('payments')
      .select('id,user_id,payment_id,amount,status,provider,created_at')
      .order('created_at', { ascending: false })
      .limit(LIST_LIMIT)
    if (error) return { rows: [], revenue: 0, degraded: true }

    const userIds = [...new Set((data ?? []).map((p) => p.user_id))]
    const emails = new Map<string, string | null>()
    if (userIds.length) {
      const { data: profs } = await admin.from('profiles').select('id,email').in('id', userIds)
      for (const p of profs ?? []) emails.set(p.id, p.email)
    }
    const rows: PaymentRow[] = (data ?? []).map((p) => ({
      id: p.id,
      userId: p.user_id,
      email: emails.get(p.user_id) ?? null,
      paymentId: p.payment_id,
      amount: p.amount,
      status: p.status,
      provider: p.provider,
      createdAt: p.created_at,
    }))
    const revenue = rows.filter((r) => r.status === 'paid').reduce((s, r) => s + r.amount, 0)
    return { rows, revenue, degraded: false }
  } catch {
    return { rows: [], revenue: 0, degraded: true }
  }
}

export interface AuditRow {
  id: number
  actorEmail: string | null
  action: string
  targetType: string | null
  targetId: string | null
  createdAt: string
}

export async function listAudit(limit = 100): Promise<{ rows: AuditRow[]; degraded: boolean }> {
  if (!isAdminConfigured()) return { rows: [], degraded: true }
  const admin = createAdminClient()
  try {
    const { data, error } = await admin
      .from('audit_logs')
      .select('id,actor_email,action,target_type,target_id,created_at')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) return { rows: [], degraded: true }
    return {
      rows: (data ?? []).map((a) => ({
        id: a.id,
        actorEmail: a.actor_email,
        action: a.action,
        targetType: a.target_type,
        targetId: a.target_id,
        createdAt: a.created_at,
      })),
      degraded: false,
    }
  } catch {
    return { rows: [], degraded: true }
  }
}

export interface NoticeAdminRow {
  id: number
  title: string
  body: string
  pinned: boolean
  published: boolean
  publishedAt: string
}

export async function listNoticesAdmin(): Promise<{ rows: NoticeAdminRow[]; degraded: boolean }> {
  if (!isAdminConfigured()) return { rows: [], degraded: true }
  const admin = createAdminClient()
  try {
    const { data, error } = await admin
      .from('notices')
      .select('id,title,body,pinned,published,published_at')
      .order('pinned', { ascending: false })
      .order('published_at', { ascending: false })
    if (error) return { rows: [], degraded: true }
    return {
      rows: (data ?? []).map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        pinned: n.pinned,
        published: n.published,
        publishedAt: n.published_at,
      })),
      degraded: false,
    }
  } catch {
    return { rows: [], degraded: true }
  }
}
