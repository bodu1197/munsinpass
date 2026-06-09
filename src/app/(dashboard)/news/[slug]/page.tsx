import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getNewsBySlug } from '@/lib/news/store'
import { SITE_URL, SITE_NAME } from '@/lib/site'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const item = await getNewsBySlug(slug)
  if (!item) return { title: '뉴스 | 문신패스' }
  const description = item.summary.slice(0, 150)
  return {
    title: `${item.title} | 문신패스 뉴스`,
    description,
    alternates: { canonical: `${SITE_URL}/news/${item.slug}` },
    openGraph: {
      title: item.title,
      description,
      type: 'article',
      url: `${SITE_URL}/news/${item.slug}`,
    },
  }
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params
  const item = await getNewsBySlug(slug)
  if (!item) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: item.title,
    description: item.summary,
    datePublished: item.publishedAt ?? undefined,
    dateModified: item.publishedAt ?? undefined,
    author: { '@type': 'Organization', name: item.sourceName },
    publisher: { '@type': 'Organization', name: SITE_NAME },
    mainEntityOfPage: `${SITE_URL}/news/${item.slug}`,
  }

  return (
    <article className="py-6 max-w-2xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/news" className="text-sm text-muted hover:text-foreground transition-colors">
        ← 뉴스 목록
      </Link>

      <div className="flex items-center gap-2 mt-4 mb-2">
        {item.tier === 1 ? (
          <span className="rounded-full bg-primary px-2 py-0.5 text-[0.7rem] font-semibold text-on-primary">
            공식
          </span>
        ) : (
          <span className="rounded-full border border-border px-2 py-0.5 text-[0.7rem] font-semibold text-muted">
            언론
          </span>
        )}
        <span className="text-xs text-subtle">{item.sourceName}</span>
        {item.category && <span className="text-xs text-subtle">· {item.category}</span>}
        <span className="tabular text-xs text-subtle ml-auto">{fmtDate(item.publishedAt)}</span>
      </div>

      <h1 className="text-2xl font-bold leading-snug">{item.title}</h1>

      <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-[0.7rem] font-semibold text-primary">
        AI 요약
      </div>
      <p className="prose-read mt-2 text-[1rem] text-foreground/90 leading-relaxed whitespace-pre-line">
        {item.summary}
      </p>

      <a
        href={item.sourceUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="inline-block mt-6 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover transition-colors"
      >
        원문 보기 →
      </a>

      <p className="text-xs text-subtle leading-relaxed border-t border-border pt-4 mt-8">
        ※ 본 요약은 AI가 원문을 바탕으로 작성한 것으로, 사실관계·일정·기준은 원문과 보건복지부·한국보건의료인국가시험원
        공식 공고를 반드시 확인하세요.
      </p>
    </article>
  )
}
