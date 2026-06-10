// 관리자 페이지 공용 UI(서버 컴포넌트). 디자인 토큰 일관성 유지용.

export function PageTitle({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-xl font-bold">{title}</h1>
      {desc && <p className="text-sm text-muted mt-1">{desc}</p>}
    </div>
  )
}

/** 마이그레이션 미적용 등으로 일부 집계가 실패했을 때의 안내 */
export function DegradedBanner({ items }: { items: string[] }) {
  if (!items.length) return null
  return (
    <div
      role="status"
      className="mb-4 rounded-xl border border-border bg-warning-soft px-4 py-3 text-xs text-warning leading-relaxed"
    >
      <strong>주의</strong> — 일부 데이터를 불러오지 못했습니다({items.join(', ')}). 마이그레이션(
      <span className="tabular">0003·0004·0005</span>)을 Supabase에 적용하면 정상 표시됩니다.
    </div>
  )
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">{children}</p>
  )
}
