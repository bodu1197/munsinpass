'use client'

import { useEffect } from 'react'

// 프로덕션에서만 /sw.js 등록 (개발 중 캐시 혼선 방지).
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* 등록 실패는 무시(앱은 일반 웹으로 정상 동작) */
      })
    }
    if (document.readyState === 'complete') register()
    else {
      window.addEventListener('load', register, { once: true })
      return () => window.removeEventListener('load', register)
    }
  }, [])
  return null
}
