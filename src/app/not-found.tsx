import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4 text-center">
      <p className="tabular text-6xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-lg font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="mt-2 text-sm text-muted">요청하신 페이지가 없거나 이동되었어요.</p>
      <div className="mt-6 flex gap-2">
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-sm font-semibold transition-colors"
        >
          홈으로
        </Link>
        <Link
          href="/study"
          className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-surface-2 transition-colors"
        >
          학습 시작
        </Link>
      </div>
    </main>
  )
}
