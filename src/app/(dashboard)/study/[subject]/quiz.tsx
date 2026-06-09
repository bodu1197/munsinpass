'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Question, SubjectMeta } from '@/data/questions'
import { recordAnswer } from '@/lib/progress'
import { useIsBookmarked, toggleBookmark } from '@/lib/bookmarks'
import {
  IconArrowRight,
  IconBookmark,
  IconCheck,
  IconRefresh,
  IconTrophy,
  IconX,
  SUBJECT_ICON,
} from '@/components/icons'

type Mode = 'learn' | 'test'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function Quiz({
  subject,
  questions,
  initialMode,
}: {
  subject: SubjectMeta
  questions: Question[]
  initialMode: Mode
}) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [ordered, setOrdered] = useState<Question[]>(() => shuffle(questions))
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<(number | null)[]>(() => questions.map(() => null))
  const [revealed, setRevealed] = useState<boolean[]>(() => questions.map(() => false))
  const [finished, setFinished] = useState(false)

  const total = ordered.length
  const current = ordered[idx]

  function restart(nextMode: Mode = mode) {
    setMode(nextMode)
    setOrdered(shuffle(questions))
    setIdx(0)
    setSelected(questions.map(() => null))
    setRevealed(questions.map(() => false))
    setFinished(false)
  }

  function handleLearnSelect(choice: number) {
    if (revealed[idx]) return
    const correct = choice === current.answer
    setSelected((s) => {
      const n = [...s]
      n[idx] = choice
      return n
    })
    setRevealed((r) => {
      const n = [...r]
      n[idx] = true
      return n
    })
    recordAnswer({ questionId: current.id, subject: current.subject, correct })
  }

  function handleTestSelect(choice: number) {
    setSelected((s) => {
      const n = [...s]
      n[idx] = choice
      return n
    })
  }

  function submitTest() {
    ordered.forEach((q, i) => {
      recordAnswer({ questionId: q.id, subject: q.subject, correct: selected[i] === q.answer })
    })
    setFinished(true)
  }

  const answeredCount = selected.filter((s) => s !== null).length
  const correctCount = ordered.reduce((acc, q, i) => acc + (selected[i] === q.answer ? 1 : 0), 0)
  const scorePct = total > 0 ? Math.round((correctCount / total) * 100) : 0

  // ───────── 결과 ─────────
  if (finished) {
    return (
      <div>
        <ResultSummary
          subject={subject}
          total={total}
          correctCount={correctCount}
          scorePct={scorePct}
          onRestart={() => restart()}
        />
        <h3 className="text-sm font-bold mt-8 mb-3">문항별 해설</h3>
        <ol className="space-y-3">
          {ordered.map((q, i) => (
            <ReviewCard key={q.id} index={i} question={q} picked={selected[i]} />
          ))}
        </ol>
      </div>
    )
  }

  // ───────── 진행 ─────────
  const SubjectIcon = SUBJECT_ICON[subject.key]
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="grid place-items-center h-9 w-9 rounded-xl bg-primary-soft text-primary">
            <SubjectIcon size={19} />
          </span>
          <h1 className="text-lg font-bold">{subject.label}</h1>
        </div>
        <ModeToggle mode={mode} onChange={(m) => restart(m)} />
      </div>

      <p className="text-xs text-subtle mb-4">
        ※ 학습용 예상문제입니다. 실제 국가시험 문제와 다를 수 있습니다.
      </p>

      {/* 진행 바 */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs text-muted mb-1.5">
          <span className="tabular">
            {idx + 1} / {total} 문항
          </span>
          {mode === 'test' && <span className="tabular">{answeredCount}개 응답</span>}
        </div>
        <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((idx + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* 문제 카드 */}
      <div className="rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <p className="prose-read font-medium">{current.question}</p>
          <BookmarkButton id={current.id} />
        </div>

        <div className="mt-5 space-y-2.5">
          {current.choices.map((choice, ci) => (
            <ChoiceButton
              key={ci}
              index={ci}
              label={choice}
              state={choiceState(mode, revealed[idx], selected[idx], current.answer, ci)}
              onClick={() =>
                mode === 'learn' ? handleLearnSelect(ci) : handleTestSelect(ci)
              }
              disabled={mode === 'learn' && revealed[idx]}
            />
          ))}
        </div>

        {mode === 'learn' && revealed[idx] && (
          <Explanation correct={selected[idx] === current.answer} text={current.explanation} />
        )}
      </div>

      {/* 컨트롤 */}
      <div className="mt-4 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => idx > 0 && setIdx(idx - 1)}
          disabled={idx === 0}
          className="px-4 py-3 rounded-xl border border-border text-sm font-medium text-muted disabled:opacity-40 hover:bg-surface-2 transition-colors cursor-pointer disabled:cursor-default"
        >
          이전
        </button>

        {mode === 'learn' ? (
          <button
            type="button"
            onClick={() => (idx < total - 1 ? setIdx(idx + 1) : setFinished(true))}
            disabled={!revealed[idx]}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-40 text-on-primary text-sm font-semibold transition-colors cursor-pointer disabled:cursor-default"
          >
            {idx < total - 1 ? '다음 문제' : '결과 보기'}
            <IconArrowRight size={16} />
          </button>
        ) : idx < total - 1 ? (
          <button
            type="button"
            onClick={() => setIdx(idx + 1)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-sm font-semibold transition-colors cursor-pointer"
          >
            다음
            <IconArrowRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={submitTest}
            className="flex-1 px-4 py-3 rounded-xl bg-success hover:opacity-90 text-white text-sm font-semibold transition-opacity cursor-pointer"
          >
            제출하고 채점
          </button>
        )}
      </div>
    </div>
  )
}

type ChoiceVisualState = 'idle' | 'picked' | 'correct' | 'wrong' | 'dim'

function choiceState(
  mode: Mode,
  revealed: boolean,
  picked: number | null,
  answer: number,
  ci: number
): ChoiceVisualState {
  const showResult = mode === 'learn' && revealed
  if (showResult) {
    if (ci === answer) return 'correct'
    if (ci === picked) return 'wrong'
    return 'dim'
  }
  return picked === ci ? 'picked' : 'idle'
}

function BookmarkButton({ id }: { id: string }) {
  const on = useIsBookmarked(id)
  return (
    <button
      type="button"
      onClick={() => toggleBookmark(id)}
      aria-label={on ? '북마크 해제' : '북마크 추가'}
      aria-pressed={on}
      className={`shrink-0 grid place-items-center h-9 w-9 rounded-xl border transition-colors cursor-pointer ${
        on
          ? 'border-primary bg-primary-soft text-primary'
          : 'border-border text-subtle hover:text-foreground'
      }`}
    >
      <IconBookmark size={17} fill={on ? 'currentColor' : 'none'} />
    </button>
  )
}

function ChoiceButton({
  index,
  label,
  state,
  onClick,
  disabled,
}: {
  index: number
  label: string
  state: ChoiceVisualState
  onClick: () => void
  disabled?: boolean
}) {
  const box: Record<ChoiceVisualState, string> = {
    idle: 'border-border hover:border-primary',
    picked: 'border-primary bg-primary-soft',
    correct: 'border-success bg-success-soft',
    wrong: 'border-danger bg-danger-soft',
    dim: 'border-border opacity-60',
  }
  const badge: Record<ChoiceVisualState, string> = {
    idle: 'bg-surface-2 text-muted',
    picked: 'bg-primary text-on-primary',
    correct: 'bg-success text-white',
    wrong: 'bg-danger text-white',
    dim: 'bg-surface-2 text-subtle',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-start gap-3 px-4 py-3.5 rounded-xl border text-left transition-colors cursor-pointer disabled:cursor-default ${box[state]}`}
    >
      <span
        className={`mt-0.5 grid place-items-center h-6 w-6 shrink-0 rounded-lg text-xs font-bold ${badge[state]}`}
      >
        {state === 'correct' ? (
          <IconCheck size={14} />
        ) : state === 'wrong' ? (
          <IconX size={14} />
        ) : (
          index + 1
        )}
      </span>
      <span className="flex-1 text-[0.95rem] leading-relaxed">{label}</span>
    </button>
  )
}

function Explanation({ correct, text }: { correct: boolean; text: string }) {
  return (
    <div className="mt-5 pt-4 border-t border-border">
      <p
        className={`flex items-center gap-1.5 text-sm font-bold ${
          correct ? 'text-success' : 'text-danger'
        }`}
      >
        {correct ? <IconCheck size={16} /> : <IconX size={16} />}
        {correct ? '정답입니다' : '오답입니다'}
      </p>
      <p className="prose-read mt-2 text-[0.95rem] text-muted rounded-xl bg-surface-2 p-3.5">
        {text}
      </p>
    </div>
  )
}

function ReviewCard({
  index,
  question,
  picked,
}: {
  index: number
  question: Question
  picked: number | null
}) {
  const ok = picked === question.answer
  return (
    <li className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start gap-2.5">
        <span
          className={`mt-0.5 grid place-items-center h-5 w-5 shrink-0 rounded-full text-white ${
            ok ? 'bg-success' : 'bg-danger'
          }`}
        >
          {ok ? <IconCheck size={12} /> : <IconX size={12} />}
        </span>
        <p className="font-medium text-[0.95rem] leading-relaxed">
          <span className="tabular text-subtle mr-1">{index + 1}.</span>
          {question.question}
        </p>
      </div>
      <p className="mt-2 ml-7 text-xs text-muted">
        정답 {question.answer + 1}. {question.choices[question.answer]}
        {picked !== null && !ok && (
          <>
            {' · '}내 답 {picked + 1}. {question.choices[picked]}
          </>
        )}
        {picked === null && ' · 미응답'}
      </p>
      <p className="prose-read mt-2 ml-7 text-[0.9rem] text-muted rounded-xl bg-surface-2 p-3">
        {question.explanation}
      </p>
    </li>
  )
}

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="inline-flex rounded-xl border border-border bg-surface-2 p-0.5 text-xs">
      {(['learn', 'test'] as Mode[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            mode === m ? 'bg-surface text-foreground shadow-[var(--shadow-card)]' : 'text-muted'
          }`}
        >
          {m === 'learn' ? '학습 모드' : '시험 모드'}
        </button>
      ))}
    </div>
  )
}

function ResultSummary({
  subject,
  total,
  correctCount,
  scorePct,
  onRestart,
}: {
  subject: SubjectMeta
  total: number
  correctCount: number
  scorePct: number
  onRestart: () => void
}) {
  const pass = scorePct >= 60
  return (
    <div className="rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] p-7 text-center">
      <span
        className={`inline-grid place-items-center h-12 w-12 rounded-2xl ${
          pass ? 'bg-primary-soft text-primary' : 'bg-danger-soft text-danger'
        }`}
      >
        <IconTrophy size={24} />
      </span>
      <p className="mt-3 text-sm text-muted">{subject.label} 결과</p>
      <p className={`tabular mt-1 text-5xl font-bold ${pass ? 'text-primary' : 'text-danger'}`}>
        {scorePct}
        <span className="text-2xl">점</span>
      </p>
      <p className="mt-1 text-sm text-muted tabular">
        {total}문항 중 {correctCount}문항 정답
      </p>
      <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-sm font-semibold transition-colors cursor-pointer"
        >
          <IconRefresh size={16} />
          다시 풀기
        </button>
        <Link
          href="/study/wrong-answers"
          className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-surface-2 transition-colors"
        >
          오답노트 보기
        </Link>
        <Link
          href="/study"
          className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-surface-2 transition-colors"
        >
          과목 목록
        </Link>
      </div>
    </div>
  )
}
