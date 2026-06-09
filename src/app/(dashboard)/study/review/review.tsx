'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useProgress } from '@/lib/progress'
import { getReview } from '@/lib/srs'
import { ReviewFlow } from '@/components/review-flow'
import { IconArrowRight, IconRefresh } from '@/components/icons'

export function Review() {
  const { stats, hydrated } = useProgress()
  const info = useMemo(() => getReview(), [stats])
  const [reviewIds, setReviewIds] = useState<string[] | null>(null)

  if (!hydrated) {
    return <div className="h-40 animate-pulse rounded-2xl bg-surface-2" />
  }

  if (reviewIds) {
    return <ReviewFlow ids={reviewIds} onExit={() => setReviewIds(null)} title="복습" />
  }

  if (info.dueCount === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-10 text-center">
        <span className="inline-grid place-items-center h-12 w-12 rounded-2xl bg-success-soft text-success">
          <IconRefresh size={24} />
        </span>
        <p className="mt-3 font-semibold">지금 복습할 문제가 없습니다</p>
        <p className="mt-1 text-sm text-muted">
          {info.tracked === 0
            ? '문제를 풀면 복습 일정이 자동으로 잡힙니다.'
            : info.nextDueInDays != null
              ? `다음 복습 예정: 약 ${info.nextDueInDays}일 후`
              : '복습 일정을 계산 중입니다.'}
        </p>
        <Link
          href="/study"
          className="inline-block mt-5 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-sm font-semibold transition-colors"
        >
          과목별 학습 가기
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] p-6 text-center">
      <p className="text-sm text-muted">오늘 복습할 문제</p>
      <p className="tabular text-4xl font-bold text-primary mt-1">
        {info.dueCount}
        <span className="text-xl">문제</span>
      </p>
      <p className="mt-2 text-xs text-subtle">간격 반복(스페이스드 리피티션)으로 약점을 장기 기억으로 굳힙니다.</p>
      <button
        type="button"
        onClick={() => setReviewIds(info.dueIds)}
        className="mt-5 inline-flex items-center gap-1.5 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-sm font-semibold transition-colors cursor-pointer"
      >
        복습 시작
        <IconArrowRight size={16} />
      </button>
    </div>
  )
}
