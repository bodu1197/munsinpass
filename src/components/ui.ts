// 공용 UI 클래스/헬퍼 — 입력창·필터 칩 스타일 중복 제거(검색·용어·플래시카드·설정 등).
export const inputClass =
  'w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground text-[0.95rem] placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'

export function chipClass(active: boolean): string {
  return `inline-flex items-center h-11 px-3 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
    active ? 'border-primary bg-primary-soft text-primary' : 'border-border text-muted hover:text-foreground'
  }`
}
