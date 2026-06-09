'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { getQuestionById, SUBJECT_MAP } from '@/data/questions'
import { useBookmarks, removeBookmark } from '@/lib/bookmarks'
import { useHydrated } from '@/lib/progress'
import { IconBookmark, IconX, SUBJECT_ICON } from '@/components/icons'

export function Bookmarks() {
  const ids = useBookmarks()
  const hydrated = useHydrated()
  const questions = useMemo(() => ids.map(getQuestionById).filter(Boolean), [ids])

  if (!hydrated) {
    return <div className="h-40 animate-pulse rounded-2xl bg-surface-2" />
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-10 text-center">
        <span className="inline-grid place-items-center h-12 w-12 rounded-2xl bg-primary-soft text-primary">
          <IconBookmark size={24} />
        </span>
        <p className="mt-3 font-semibold">아직 북마크한 문제가 없습니다</p>
        <p className="mt-1 text-sm text-muted">문제를 풀 때 북마크 버튼(﹅)을 누르면 여기에 모입니다.</p>
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
    <div>
      <p className="text-sm text-foreground mb-4 rounded-2xl border border-border bg-surface px-4 py-3.5">
        북마크한 문제 <b className="text-primary">{questions.length}개</b>
      </p>
      <ul className="space-y-2.5">
        {questions.map((q) => {
          if (!q) return null
          const meta = SUBJECT_MAP[q.subject]
          const Icon = SUBJECT_ICON[q.subject]
          return (
            <li key={q.id} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-surface-2 text-muted">
                  <Icon size={13} />
                  {meta.label}
                </span>
                <button
                  type="button"
                  onClick={() => removeBookmark(q.id)}
                  aria-label="북마크 해제"
                  className="shrink-0 text-subtle hover:text-danger transition-colors cursor-pointer"
                >
                  <IconX size={15} />
                </button>
              </div>
              <p className="text-[0.95rem] font-medium leading-relaxed">{q.question}</p>
              <p className="mt-2 text-xs text-muted">
                정답 {q.answer + 1}. {q.choices[q.answer]}
              </p>
              <p className="prose-read mt-2 text-[0.9rem] text-muted rounded-xl bg-surface-2 p-3">
                {q.explanation}
              </p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
