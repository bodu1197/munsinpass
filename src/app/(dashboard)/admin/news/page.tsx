import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { isSupabaseConfigured } from '@/utils/supabase/config'
import { createAdminClient, isAdminConfigured } from '@/utils/supabase/admin'
import { isUserAdmin } from '@/lib/admin-access'
import { DraftActions } from '@/components/draft-actions'
import { DRAFT_EXPIRY_DAYS, daysUntilExpiry } from '@/lib/news/expiry'

export const metadata: Metadata = {
  title: '뉴스 검토 | 문신패스',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

interface DraftRow {
  slug: string
  title: string
  summary: string
  source_name: string
  source_url: string
  tier: number
  category: string | null
  relevance: number | null
  created_at: string
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-10">
      <p className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">{children}</p>
    </div>
  )
}

export default async function AdminNewsPage() {
  if (!isSupabaseConfigured()) {
    return <Notice>Supabase가 설정되지 않았습니다.</Notice>
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/admin/news')
  if (!(await isUserAdmin(supabase, user))) {
    return <Notice>접근 권한이 없습니다. (관리자 전용)</Notice>
  }
  if (!isAdminConfigured()) {
    return <Notice>SUPABASE_SERVICE_ROLE_KEY 미설정 — 검토 기능이 비활성 상태입니다.</Notice>
  }

  const admin = createAdminClient()
  const { data } = await admin
    .from('news_items')
    .select('slug,title,summary,source_name,source_url,tier,category,relevance,created_at')
    .eq('status', 'draft')
    .order('created_at', { ascending: true }) // 오래된(=삭제 임박) 항목이 먼저 보이도록
    .limit(100)
  const drafts = (data as DraftRow[] | null) ?? []

  return (
    <div className="py-6">
      <h1 className="text-xl font-bold mb-1">뉴스 검토</h1>
      <p className="text-sm text-muted mb-6">
        언론(Tier 2) 출처는 검토 후 게시됩니다. 공식(Tier 1) 출처는 자동 게시됩니다. 대기 {drafts.length}건.
      </p>

      {drafts.length === 0 ? (
        <Notice>검토 대기 중인 뉴스가 없습니다.</Notice>
      ) : (
        <ul className="space-y-3">
          {drafts.map((d) => {
            const left = daysUntilExpiry(d.created_at, DRAFT_EXPIRY_DAYS)
            return (
            <li key={d.slug} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="rounded-full border border-border px-2 py-0.5 text-[0.7rem] font-semibold text-muted">
                  언론
                </span>
                <span className="text-xs text-subtle">{d.source_name}</span>
                {d.category && <span className="text-xs text-subtle">· {d.category}</span>}
                {d.relevance != null && (
                  <span className="text-xs text-subtle">· 관련도 {d.relevance}</span>
                )}
                {left <= 1 && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[0.7rem] font-semibold text-red-700">
                    {left < 0 ? `삭제 기한 ${-left}일 경과` : left === 0 ? '오늘 삭제 예정' : '삭제 D-1'}
                  </span>
                )}
              </div>
              <h2 className="font-semibold text-[1.05rem]">{d.title}</h2>
              <p className="prose-read mt-2 text-[0.95rem] text-muted">{d.summary}</p>
              <a
                href={d.source_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-block mt-2 text-xs font-medium text-primary hover:underline"
              >
                원문 보기 →
              </a>
              <DraftActions slug={d.slug} />
            </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
