'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 운영 환경에서는 에러 모니터링 서비스로 전송하세요.
    console.error(error)
  }, [error])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4 text-center">
      <span className="grid place-items-center h-12 w-12 rounded-2xl bg-danger-soft text-danger">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      </span>
      <h1 className="mt-4 text-lg font-bold">문제가 발생했습니다</h1>
      <p className="mt-2 text-sm text-muted">잠시 후 다시 시도해주세요.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-sm font-semibold transition-colors cursor-pointer"
      >
        다시 시도
      </button>
    </main>
  )
}
