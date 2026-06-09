import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // 개인 데이터·인증·관리자 페이지는 수집 제외
        disallow: ['/dashboard', '/auth/', '/admin', '/settings', '/onboarding'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
