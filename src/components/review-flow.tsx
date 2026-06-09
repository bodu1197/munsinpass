'use client'

// 문제 복습 플로우 (오답노트·스페이스드 리피티션 복습 공용)
import { useMemo, useState } from 'react'
import { getQuestionById, SUBJECT_MAP } from '@/data/questions'
import { recordAnswer } from '@/lib/progress'
import { IconCheck, IconX, SUBJECT_ICON } from '@/components/icons'

export function ReviewFlow({
  ids,
  onExit,
  title = '복습',
}: {
  ids: string[]
  onExit: () => void
  title?: string
}) {
  const questions = useMemo(() => ids.map(getQuestionById).filter(Boolean), [ids])
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [solvedCorrect, setSolvedCorrect] = useState(0)

  const current = questions[idx]
  const total = questions.length

  if (!current) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-10 text-center">
        <span className="inline-grid place-items-center h-12 w-12 rounded-2xl bg-success-soft text-success">
          <IconCheck size={24} />
        </span>
        <p className="mt-3 font-semibold">복습을 마쳤어요!</p>
        <button
          type="button"
          onClick={onExit}
          className="mt-5 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-sm font-semibold transition-colors cursor-pointer"
        >
          돌아가기
        </button>
      </div>
    )
  }

  function select(choice: number) {
    if (revealed) return
    const correct = choice === current!.answer
    setSelected(choice)
    setRevealed(true)
    if (correct) setSolvedCorrect((c) => c + 1)
    recordAnswer({ questionId: current!.id, subject: current!.subject, correct })
  }

  function next() {
    if (idx < total - 1) {
      setIdx(idx + 1)
      setSelected(null)
      setRevealed(false)
    } else {
      onExit()
    }
  }

  const meta = SUBJECT_MAP[current.subject]
  const Icon = SUBJECT_ICON[current.subject]

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="tabular text-xs text-muted">
          {title} {idx + 1} / {total}
        </span>
        <button
          type="button"
          onClick={onExit}
          className="text-xs text-subtle hover:text-foreground transition-colors cursor-pointer"
        >
          그만하기
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] p-5 sm:p-6">
        <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-surface-2 text-muted">
          <Icon size={13} />
          {meta.label}
        </span>
        <p className="prose-read font-medium mt-3">{current.question}</p>

        <div className="mt-5 space-y-2.5">
          {current.choices.map((choice, ci) => {
            const isAnswer = current.answer === ci
            const isPicked = selected === ci
            let box = 'border-border hover:border-primary'
            let badge = 'bg-surface-2 text-muted'
            let mark: React.ReactNode = ci + 1
            if (revealed) {
              if (isAnswer) {
                box = 'border-success bg-success-soft'
                badge = 'bg-success text-white'
                mark = <IconCheck size={14} />
              } else if (isPicked) {
                box = 'border-danger bg-danger-soft'
                badge = 'bg-danger text-white'
                mark = <IconX size={14} />
              } else {
                box = 'border-border opacity-60'
                badge = 'bg-surface-2 text-subtle'
              }
            }
            return (
              <button
                key={ci}
                type="button"
                onClick={() => select(ci)}
                disabled={revealed}
                className={`w-full flex items-start gap-3 px-4 py-3.5 rounded-xl border text-left transition-colors cursor-pointer disabled:cursor-default ${box}`}
              >
                <span className={`mt-0.5 grid place-items-center h-6 w-6 shrink-0 rounded-lg text-xs font-bold ${badge}`}>
                  {mark}
                </span>
                <span className="flex-1 text-[0.95rem] leading-relaxed">{choice}</span>
              </button>
            )
          })}
        </div>

        {revealed && (
          <div className="mt-5 pt-4 border-t border-border">
            <p
              className={`flex items-center gap-1.5 text-sm font-bold ${
                selected === current.answer ? 'text-success' : 'text-danger'
              }`}
            >
              {selected === current.answer ? <IconCheck size={16} /> : <IconX size={16} />}
              {selected === current.answer ? '정답입니다' : '오답입니다'}
            </p>
            <p className="prose-read mt-2 text-[0.95rem] text-muted rounded-xl bg-surface-2 p-3.5">
              {current.explanation}
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={next}
        disabled={!revealed}
        className="mt-4 w-full px-4 py-3 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-40 text-on-primary text-sm font-semibold transition-colors cursor-pointer disabled:cursor-default"
      >
        {idx < total - 1 ? '다음 문제' : `복습 완료 (${solvedCorrect}/${total} 정답)`}
      </button>
    </div>
  )
}
