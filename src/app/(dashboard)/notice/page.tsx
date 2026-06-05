import type { Metadata } from 'next'
import { NOTICES } from '@/data/notices'
import { IconBell } from '@/components/icons'

export const metadata: Metadata = {
  title: '공지사항 | 문신패스',
  description: '문신패스 서비스 업데이트와 점검 등 공지사항을 확인하세요.',
}

export default function NoticePage() {
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
        {NOTICES.map((n) => (
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
