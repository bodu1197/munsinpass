'use client'

import { useEffect } from 'react'
import { syncProgress } from '@/lib/progress-sync'

/** 로그인 시 진도를 서버와 동기화(마운트 + 창 포커스 시). 렌더 출력 없음. */
export function ProgressSync() {
  useEffect(() => {
    void syncProgress()
    const onFocus = () => void syncProgress()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])
  return null
}
