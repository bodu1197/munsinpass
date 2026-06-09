import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'
import { CURRICULUM } from '@/data/curriculum'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  // 공개(로그인 불필요) 페이지만 등록. 개인 학습(퀴즈·대시보드)은 로그인 게이트라 제외.
  const routes: {
    path: string
    priority: number
    freq: MetadataRoute.Sitemap[number]['changeFrequency']
  }[] = [
    { path: '', priority: 1, freq: 'weekly' },
    { path: '/textbook', priority: 0.9, freq: 'weekly' },
    { path: '/faq', priority: 0.9, freq: 'monthly' },
    { path: '/news', priority: 0.8, freq: 'daily' },
    { path: '/notice', priority: 0.7, freq: 'weekly' },
    { path: '/community', priority: 0.6, freq: 'daily' },
    { path: '/auth/signup', priority: 0.4, freq: 'monthly' },
    { path: '/legal/terms', priority: 0.3, freq: 'yearly' },
    { path: '/legal/privacy', priority: 0.3, freq: 'yearly' },
  ]

  const partRoutes = CURRICULUM.map((p) => ({
    path: `/textbook/${p.id}`,
    priority: 0.8,
    freq: 'monthly' as const,
  }))

  return [...routes, ...partRoutes].map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.freq,
    priority: r.priority,
  }))
}
