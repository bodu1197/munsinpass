import type { Metadata } from 'next'
import { NOTICES } from '@/data/notices'
import { IconBell } from '@/components/icons'
import { createClient } from '@/utils/supabase/server'
import { isSupabaseConfigured } from '@/utils/supabase/config'
import { fmtDate } from '@/lib/format'

export const metadata: Metadata = {
  title: '공지사항 | 문신패스',
  description: '문신패스 서비스 업데이트와 점검 등 공지사항을 확인하세요.',
}

// 게시 공지를 항상 반영(관리자 작성 즉시 노출)
export const dynamic = 'force-dynamic'

interface NoticeView {
  id: string
  title: string
  date: string
  body: string
}

// DB(공지 CMS) 우선, 비어있거나 실패 시 정적 시드 폴백
async function getNotices(): Promise<NoticeView[]> {
  const fallback: NoticeView[] = NOTICES.map((n) => ({ id: n.id, title: n.title, date: n.date, body: n.body }))
  if (!isSupabaseConfigured()) return fallback
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('notices')
      .select('id,title,body,published_at,pinned')
      .eq('published', true)
      .order('pinned', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(50)
    if (error || !data || data.length === 0) return fallback
    return data.map((n) => ({ id: String(n.id), title: n.title, date: fmtDate(n.published_at), body: n.body }))
  } catch {
    return fallback
  }
}

export default async function NoticePage() {
  const notices = await getNotices()
  return (
    <div className="py-6">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="grid place-items-center h-9 w-9 rounded-xl bg-primary-soft text-primary">
          <IconBell size={19} />
        </span>
        <h1 className="text-xl font-bold">공지사항</h1>
      </div>
      <p className="text-sm text-muted mb-6">서비스 업데이트·점검 등 소식입니다.</p>

      <ul className="space-y-3">
        {notices.map((n) => (
          <li key={n.id} className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-semibold text-[1.05rem]">{n.title}</h2>
              <span className="tabular text-xs text-subtle shrink-0">{n.date}</span>
            </div>
            <p className="prose-read mt-2 text-[0.95rem] text-muted">{n.body}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
