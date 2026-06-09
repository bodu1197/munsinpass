import type { Metadata } from 'next'
import Link from 'next/link'
import { NEWS } from '@/data/news'
import { IconNewspaper } from '@/components/icons'
import { getPublishedNews } from '@/lib/news/store'

export const metadata: Metadata = {
  title: '뉴스 | 문신패스',
  description: '문신사법과 국가시험 관련 최신 소식을 신뢰할 수 있는 공식·언론 출처에서 모았습니다.',
}

// 자동 수집된 최신 뉴스를 항상 반영
export const dynamic = 'force-dynamic'

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function SourceBadge({ tier }: { tier: number }) {
  return tier === 1 ? (
    <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[0.7rem] font-semibold text-on-primary">
      공식
    </span>
  ) : (
    <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[0.7rem] font-semibold text-muted">
      언론
    </span>
  )
}

export default async function NewsPage() {
  const items = await getPublishedNews(60)
  const hasLive = items.length > 0

  return (
    <div className="py-6">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="grid place-items-center h-9 w-9 rounded-xl bg-primary-soft text-primary">
          <IconNewspaper size={19} />
        </span>
        <h1 className="text-xl font-bold">뉴스</h1>
      </div>
      <p className="text-sm text-muted mb-4">문신사법·국가시험 관련 소식입니다.</p>

      {hasLive && (
        <p className="text-xs text-subtle leading-relaxed rounded-xl bg-primary-soft/40 border border-border px-3.5 py-2.5 mb-5">
          요약은 AI가 원문을 바탕으로 생성하며, 정확한 내용은 각 글의 <strong>원문·공식 출처</strong>를 확인하세요.
          <span className="text-primary font-medium"> 공식</span> 배지는 정부·법령 등 1차 출처입니다.
        </p>
      )}

      <ul className="space-y-3">
        {hasLive
          ? items.map((n) => (
              <li key={n.slug} className="rounded-2xl border border-border bg-surface p-5">
                <Link href={`/news/${n.slug}`} className="block group">
                  <div className="flex items-center gap-2 mb-1.5">
                    <SourceBadge tier={n.tier} />
                    <span className="text-xs text-subtle truncate">{n.sourceName}</span>
                    <span className="tabular text-xs text-subtle shrink-0 ml-auto">{fmtDate(n.publishedAt)}</span>
                  </div>
                  <h2 className="font-semibold text-[1.05rem] group-hover:text-primary transition-colors">
                    {n.title}
                  </h2>
                  <p className="prose-read mt-2 text-[0.95rem] text-muted line-clamp-3">{n.summary}</p>
                </Link>
                <a
                  href={n.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-block mt-3 text-xs font-medium text-primary hover:underline"
                >
                  원문 보기 →
                </a>
              </li>
            ))
          : NEWS.map((n) => (
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
