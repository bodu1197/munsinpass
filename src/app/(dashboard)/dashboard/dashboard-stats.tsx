'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { SUBJECT_MAP } from '@/data/questions'
import { useProgress } from '@/lib/progress'
import { getReview } from '@/lib/srs'
import { daysUntilExam } from '@/lib/exam'
import { IconChevronRight, IconRefresh, SUBJECT_ICON } from '@/components/icons'

export function DashboardStats() {
  const { stats, hydrated } = useProgress()
  const dday = hydrated ? daysUntilExam() : null
  // stats 변경(문제 풀이)마다 복습 큐를 재계산하기 위한 의도적 의존성
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const review = useMemo(() => getReview(), [stats])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* D-Day */}
        <div className="col-span-2 sm:col-span-1 rounded-2xl bg-primary text-on-primary p-4 flex flex-col justify-between">
          <p className="text-xs font-medium opacity-80">첫 국가시험까지</p>
          <p className="tabular text-3xl font-bold mt-1">{dday !== null ? `D-${dday}` : 'D-—'}</p>
          <p className="text-[11px] opacity-65 mt-1">2027년 12월 기준</p>
        </div>
        <StatCard label="오늘 푼 문제" value={hydrated ? stats.solvedToday : null} unit="문" />
        <StatCard label="전체 정답률" value={hydrated ? stats.correctRate : null} unit="%" />
        <StatCard label="누적 학습" value={hydrated ? stats.uniqueAttempted : null} unit="문" />
      </div>

      {/* 오늘의 복습 */}
      <Link
        href="/study/review"
        className="flex items-center gap-3 rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] p-4 hover:border-primary transition-colors"
      >
        <span className="grid place-items-center h-10 w-10 shrink-0 rounded-xl bg-primary-soft text-primary">
          <IconRefresh size={20} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">오늘의 복습</p>
          <p className="text-xs text-muted mt-0.5">
            {!hydrated
              ? '—'
              : review.dueCount > 0
                ? `${review.dueCount}문제가 복습 대기 중`
                : '지금 복습할 문제가 없습니다'}
          </p>
        </div>
        {hydrated && review.dueCount > 0 && (
          <span className="tabular text-lg font-bold text-primary">{review.dueCount}</span>
        )}
        <IconChevronRight size={18} className="text-subtle" />
      </Link>

      {/* 과목별 진행률 */}
      <div className="rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted">과목별 진행률</p>
          <Link href="/study/stats" className="text-xs text-primary font-medium hover:underline">
            통계 자세히
          </Link>
        </div>
        <div className="space-y-3">
          {stats.bySubject.map((s) => {
            const meta = SUBJECT_MAP[s.subject]
            const Icon = SUBJECT_ICON[s.subject]
            const pct = s.total > 0 ? Math.round((s.attempted / s.total) * 100) : 0
            return (
              <div key={s.subject}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Icon size={15} className="text-primary" />
                    {meta.label}
                  </span>
                  <span className="tabular text-subtle">
                    {hydrated ? `${s.attempted}/${s.total}` : '—'}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: hydrated ? `${pct}%` : '0%' }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, unit }: { label: string; value: number | null; unit: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] p-4 flex flex-col justify-between">
      <p className="text-xs text-muted">{label}</p>
      <p className="tabular text-2xl font-bold mt-1">
        {value === null ? '—' : value}
        <span className="text-sm font-normal text-subtle ml-1">{unit}</span>
      </p>
    </div>
  )
}
