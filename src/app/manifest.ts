import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '문신패스 - 문신사 국가시험 대비',
    short_name: '문신패스',
    description: '2027년 문신사 국가시험을 체계적으로 대비하는 학습 앱',
    start_url: '/',
    display: 'standalone',
    background_color: '#fdfbf7',
    theme_color: '#fdfbf7',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
