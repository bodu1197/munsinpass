'use client'

import { useEffect } from 'react'

// 루트 레이아웃까지 실패한 경우의 최종 바운더리(자체 html/body 렌더, 인라인 스타일).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f7f6f3', color: '#20242e' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>문제가 발생했습니다</h1>
          <p style={{ color: '#59616f', marginTop: 8 }}>잠시 후 다시 시도해주세요.</p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: 20,
              padding: '10px 20px',
              borderRadius: 12,
              border: 'none',
              background: '#4f46e5',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  )
}
