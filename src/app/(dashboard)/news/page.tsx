import type { Metadata } from 'next'
import { NEWS } from '@/data/news'
import { IconNewspaper } from '@/components/icons'

export const metadata: Metadata = {
  title: '뉴스 | 문신패스',
  description: '문신사법과 국가시험 관련 최신 소식을 확인하세요.',
}

export default function NewsPage() {
  return (
    <div className="py-6">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="grid place-items-center h-9 w-9 rounded-xl bg-primary-soft text-primary">
          <IconNewspaper size={19} />
        </span>
        <h1 className="text-xl font-bold">뉴스</h1>
      </div>
      <p className="text-sm text-muted mb-6">문신사법·국가시험 관련 소식입니다.</p>

      <ul className="space-y-3">
        {NEWS.map((n) => (
          <li key={n.id} className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-semibold text-[1.05rem]">{n.title}</h2>
              <span className="tabular text-xs text-subtle shrink-0">{n.date}</span>
            </div>
            <p className="prose-read mt-2 text-[0.95rem] text-muted">{n.summary}</p>
          </li>
        ))}
      </ul>

      <p className="text-xs text-subtle leading-relaxed border-t border-border pt-4 mt-6">
        ※ 일정·기준은 변동될 수 있습니다. 정확한 내용은 보건복지부·한국보건의료인국가시험원 공식 공고를 확인하세요.
      </p>
    </div>
  )
}
