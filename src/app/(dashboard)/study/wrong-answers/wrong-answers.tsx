'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { getQuestionById, SUBJECT_MAP } from '@/data/questions'
import { useProgress } from '@/lib/progress'
import { ReviewFlow } from '@/components/review-flow'
import { IconArrowRight, IconCheck, IconSparkles, SUBJECT_ICON } from '@/components/icons'

export function WrongAnswers() {
  const { stats, hydrated } = useProgress()
  const [reviewIds, setReviewIds] = useState<string[] | null>(null)

  const wrongIds = stats.wrongQuestionIds
  const wrongQuestions = useMemo(() => wrongIds.map(getQuestionById).filter(Boolean), [wrongIds])

  if (!hydrated) {
    return <div className="h-40 animate-pulse rounded-2xl bg-surface-2" />
  }

  if (reviewIds) {
    const questions = reviewIds.map(getQuestionById).filter(Boolean)
    if (questions.length === 0) return <EmptyState reviewedAll onBack={() => setReviewIds(null)} />
    return <ReviewFlow ids={reviewIds} onExit={() => setReviewIds(null)} title="오답 복습" />
  }

  if (wrongQuestions.length === 0) return <EmptyState />

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5">
        <p className="text-sm text-foreground">
          현재 <b className="text-danger">{wrongQuestions.length}개</b>의 오답이 있습니다.
        </p>
        <button
          type="button"
          onClick={() => setReviewIds(wrongIds)}
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-sm font-semibold transition-colors cursor-pointer"
        >
          복습 시작
          <IconArrowRight size={15} />
        </button>
      </div>

      <ul className="space-y-2.5">
        {wrongQuestions.map((q) => {
          if (!q) return null
          const meta = SUBJECT_MAP[q.subject]
          const Icon = SUBJECT_ICON[q.subject]
          return (
            <li key={q.id} className="rounded-2xl border border-border bg-surface p-4">
              <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-surface-2 text-muted mb-2">
                <Icon size={13} />
                {meta.label}
              </span>
              <p className="text-[0.95rem] font-medium leading-relaxed">{q.question}</p>
              <p className="mt-2 text-xs text-muted">
                정답 {q.answer + 1}. {q.choices[q.answer]}
              </p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function EmptyState({ reviewedAll = false, onBack }: { reviewedAll?: boolean; onBack?: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-10 text-center">
      <span
        className={`inline-grid place-items-center h-12 w-12 rounded-2xl ${
          reviewedAll ? 'bg-success-soft text-success' : 'bg-primary-soft text-primary'
        }`}
      >
        {reviewedAll ? <IconCheck size={24} /> : <IconSparkles size={24} />}
      </span>
      <p className="mt-3 font-semibold">{reviewedAll ? '복습을 모두 마쳤어요!' : '아직 오답이 없습니다'}</p>
      <p className="mt-1 text-sm text-muted">
        {reviewedAll
          ? '오답을 모두 다시 맞혔습니다. 다른 문제도 풀어볼까요?'
          : '문제를 풀면 틀린 문제가 여기에 모입니다.'}
      </p>
      <div className="mt-5 flex justify-center gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-surface-2 transition-colors cursor-pointer"
          >
            오답노트로
          </button>
        )}
        <Link
          href="/study"
          className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-sm font-semibold transition-colors"
        >
          과목별 학습 가기
        </Link>
      </div>
    </div>
  )
}
