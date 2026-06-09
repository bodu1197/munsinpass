// 게시된 뉴스 RSS 피드 (/feed.xml)
import { getPublishedNews } from '@/lib/news/store'
import { SITE_URL, SITE_NAME } from '@/lib/site'

export const dynamic = 'force-dynamic'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function GET(): Promise<Response> {
  const items = await getPublishedNews(40)
  const now = new Date().toUTCString()

  const body = items
    .map((n) => {
      const pub = n.publishedAt ? new Date(n.publishedAt) : null
      const pubLine =
        pub && !Number.isNaN(pub.getTime()) ? `\n      <pubDate>${pub.toUTCString()}</pubDate>` : ''
      return `    <item>
      <title>${esc(n.title)}</title>
      <link>${SITE_URL}/news/${n.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/news/${n.slug}</guid>${pubLine}
      <description>${esc(n.summary)} (출처: ${esc(n.sourceName)})</description>
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(SITE_NAME)} 뉴스 — 문신사법·국가시험</title>
    <link>${SITE_URL}/news</link>
    <description>문신사법·문신사 국가시험 관련 신뢰 출처(공식·언론) 소식</description>
    <language>ko</language>
    <lastBuildDate>${now}</lastBuildDate>
${body}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=900, s-maxage=900',
    },
  })
}
