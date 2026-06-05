import type { Metadata } from 'next'
import Link from 'next/link'
import { SUBJECTS, getSubjectCount } from '@/data/questions'
import { IconBook, IconChecklist, IconChevronRight, IconFileText, IconPencil, SUBJECT_ICON } from '@/components/icons'

export const metadata: Metadata = {
  title: '과목별 학습 | 문신패스',
  description: '위생·감염, 법규·면허, 색소·재료, 기초 해부 과목별로 문제를 풀어보세요.',
}

export default function StudyPage() {
  return (
    <div className="py-6">
      <h1 className="text-xl font-bold mb-1">과목별 학습</h1>
      <p className="text-sm text-muted mb-5">과목을 선택해 문제를 풀어보세요.</p>

      {/* 전체 교과서 */}
      <Link
        href="/textbook"
        className="mb-5 flex items-center gap-3 p-4 rounded-2xl bg-primary text-on-primary hover:bg-primary-hover transition-colors"
      >
        <span className="grid place-items-center h-10 w-10 shrink-0 rounded-xl bg-on-primary/15">
          <IconFileText size={20} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">통합 교과서 보기</p>
          <p className="text-sm opacity-85">개론·해부·피부·보건위생·소독·재료까지 단원별 이론 정리</p>
        </div>
        <IconChevronRight size={18} className="opacity-80" />
      </Link>

      <div className="space-y-3">
        {SUBJECTS.map((s) => {
          const Icon = SUBJECT_ICON[s.key]
          return (
            <div
              key={s.key}
              className="rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] overflow-hidden"
            >
              <div className="flex items-center gap-3 px-5 py-4">
                <span className="grid place-items-center h-11 w-11 shrink-0 rounded-xl bg-primary-soft text-primary">
                  <Icon size={22} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold">{s.label}</p>
                  <p className="text-sm text-muted truncate">{s.desc}</p>
                </div>
                <span className="tabular text-xs text-subtle shrink-0">{getSubjectCount(s.key)}문항</span>
              </div>

              <div className="grid grid-cols-3 border-t border-border divide-x divide-border">
                <Link
                  href={`/study/${s.key}/theory`}
                  className="flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-foreground transition-colors"
                >
                  <IconFileText size={16} />
                  <span className="hidden sm:inline">이론</span>
                  <span className="sm:hidden">이론</span>
                </Link>
                <Link
                  href={`/study/${s.key}?mode=learn`}
                  className="flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-foreground transition-colors"
                >
                  <IconBook size={16} />
                  <span className="hidden sm:inline">학습 모드</span>
                  <span className="sm:hidden">학습</span>
                </Link>
                <Link
                  href={`/study/${s.key}?mode=test`}
                  className="flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-foreground transition-colors"
                >
                  <IconPencil size={16} />
                  <span className="hidden sm:inline">시험 모드</span>
                  <span className="sm:hidden">시험</span>
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      <Link
        href="/study/checklist"
        className="mt-4 flex items-center gap-3 p-4 rounded-2xl border border-dashed border-border-strong hover:border-primary hover:bg-primary-soft transition-colors"
      >
        <span className="grid place-items-center h-10 w-10 shrink-0 rounded-xl bg-surface-2 text-muted">
          <IconChecklist size={20} />
        </span>
        <div className="flex-1">
          <p className="font-semibold text-[0.95rem]">실기 체크리스트</p>
          <p className="text-sm text-muted">위생 순서·세팅 암기 카드</p>
        </div>
        <IconChevronRight size={18} className="text-subtle" />
      </Link>
    </div>
  )
}
