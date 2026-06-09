// 문신패스 PWA 서비스워커 — Turbopack 호환(serwist 미사용), 안전 우선.
//  · 내비게이션(HTML): 네트워크 우선 → 항상 최신, 오프라인일 때만 캐시 폴백
//  · 정적 자산(_next/static, figures, 폰트, 아이콘): 캐시 우선(불변 해시 자산)
//  · API(/api/*)·외부 출처(Supabase 등): 가로채지 않음
//  문제가 생기면 이 파일을 unregister 스텁으로 교체해 즉시 무력화 가능(skipWaiting).
const VERSION = 'v1'
const STATIC_CACHE = 'mp-static-' + VERSION
const PAGE_CACHE = 'mp-pages-' + VERSION

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys.filter((k) => k.startsWith('mp-') && !k.endsWith(VERSION)).map((k) => caches.delete(k)),
      )
      await self.clients.claim()
    })(),
  )
})

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/figures/') ||
    url.pathname.startsWith('/icon-') ||
    /\.(?:css|js|woff2?|png|jpe?g|gif|svg|webp|ico)$/.test(url.pathname)
  )
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return // 외부(Supabase 등) 미개입
  if (url.pathname.startsWith('/api/')) return // API 미개입

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(req)
        if (hit) return hit
        const res = await fetch(req)
        if (res.ok) cache.put(req, res.clone())
        return res
      }),
    )
    return
  }

  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req)
          const cache = await caches.open(PAGE_CACHE)
          cache.put(req, res.clone())
          return res
        } catch {
          const cache = await caches.open(PAGE_CACHE)
          const hit = (await cache.match(req)) || (await cache.match('/'))
          if (hit) return hit
          return new Response('오프라인입니다. 네트워크 연결을 확인하세요.', {
            status: 503,
            headers: { 'content-type': 'text/plain; charset=utf-8' },
          })
        }
      })(),
    )
  }
})
