'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { SUBJECT_MAP, type SubjectKey } from '@/data/questions'
import { getPart } from '@/data/curriculum'
import { getAnswers, recordAnswer, type AnswerRecord } from '@/lib/progress'
import {
  generateExam,
  estimateAbility,
  analyzeResult,
  recordSession,
  getCompletedSessions,
  registerGeneratedQuestions,
  generatedCount,
  type GeneratedExam,
  type ExamAnalysis,
} from '@/lib/adaptive'
import { IconCheck, IconClock, IconTarget, IconTimer, IconX, IconChevronRight, IconRefresh, IconSparkles } from '@/components/icons'

const EXAM_SIZE = 15
const SECONDS_PER_QUESTION = 60
const PASS_SCORE = 60

type Phase = 'intro' | 'running' | 'result'

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function sig(x: number) {
  return 1 / (1 + Math.exp(-x))
}
function abilityPct(global: number) {
  return Math.round(sig(global) * 100)
}
function difficultyLabel(t: number) {
  return t < 1.7 ? '하' : t < 2.4 ? '중' : '상'
}
const DIFF_LABEL: Record<number, string> = { 1: '하', 2: '중', 3: '상' }

export function MockExam() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [hydrated, setHydrated] = useState(false)
  const [sessionNo, setSessionNo] = useState(1)
  const [abilityGlobal, setAbilityGlobal] = useState(0)
  const [mastery, setMastery] = useState<Record<SubjectKey, number>>({
    hygiene: 0.5,
    anatomy: 0.5,
    ink_material: 0.5,
    law: 0.5,
  })

  const [exam, setExam] = useState<GeneratedExam | null>(null)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [idx, setIdx] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [analysis, setAnalysis] = useState<ExamAnalysis | null>(null)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiMsg, setAiMsg] = useState<string | null>(null)

  async function fetchAI(subjects: SubjectKey[], difficulty: number, avoid: string[]) {
    setAiBusy(true)
    setAiMsg(null)
    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjects, difficulty, count: 8, avoid }),
      })
      const j = await res.json()
      if (j.enabled === false) {
        setAiMsg('AI 생성이 비활성 상태입니다(OpenAI 키 미설정). 정적 적응형으로 계속 학습할 수 있습니다.')
        return
      }
      if (!j.questions?.length) {
        setAiMsg('이번엔 추가된 문항이 없습니다' + (j.error ? ` (${String(j.error).slice(0, 60)})` : ''))
        return
      }
      const added = registerGeneratedQuestions(j.questions)
      setAiMsg(`AI 약점 문항 ${added}개가 은행에 추가됐습니다. 다음 회차부터 출제됩니다. (총 보유 ${generatedCount()}개)`)
      refreshIntro()
    } catch (e) {
      setAiMsg('생성 오류: ' + String(e).slice(0, 60))
    } finally {
      setAiBusy(false)
    }
  }

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const examRef = useRef<GeneratedExam | null>(null)
  const answersRef = useRef<(number | null)[]>([])
  const beforeAnswersRef = useRef<AnswerRecord[]>([])
  useEffect(() => {
    examRef.current = exam
  }, [exam])
  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  const refreshIntro = useCallback(() => {
    const ability = estimateAbility()
    setSessionNo(getCompletedSessions() + 1)
    setAbilityGlobal(ability.global)
    setMastery(ability.masteryBySubject)
  }, [])

  useEffect(() => {
    // 마운트 시 클라이언트 전용(localStorage) 데이터로 초기화 — 의도된 패턴
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true)
    refreshIntro()
  }, [refreshIntro])

  const finish = useCallback((ex: GeneratedExam, ans: (number | null)[]) => {
    if (timerRef.current) clearInterval(timerRef.current)
    const correctById: Record<string, boolean> = {}
    ex.questions.forEach((q, i) => {
      const ok = ans[i] === q.answer
      correctById[q.id] = ok
      recordAnswer({ questionId: q.id, subject: q.subject, correct: ok })
    })
    const before = beforeAnswersRef.current
    const result = analyzeResult(ex.questions, correctById, before)
    recordSession({
      questionIds: ex.questions.map((q) => q.id),
      score: result.score,
      total: result.total,
      targetDifficulty: ex.targetDifficulty,
      abilityBefore: result.abilityBefore,
      abilityAfter: result.abilityAfter,
    })
    setAnalysis(result)
    setPhase('result')
  }, [])

  useEffect(() => {
    if (phase !== 'running') return
    timerRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          if (examRef.current) finish(examRef.current, answersRef.current)
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase, finish])

  function start() {
    beforeAnswersRef.current = getAnswers()
    const ex = generateExam(EXAM_SIZE)
    setExam(ex)
    setAnswers(ex.questions.map(() => null))
    setIdx(0)
    setRemaining(ex.questions.length * SECONDS_PER_QUESTION)
    setAnalysis(null)
    setPhase('running')
  }

  function pick(choice: number) {
    setAnswers((a) => {
      const n = [...a]
      n[idx] = choice
      return n
    })
  }

  // 다음 회차로 (결과 → 복습 후 재출제)
  function nextSession() {
    refreshIntro()
    start()
  }

  // ───────── intro ─────────
  if (phase === 'intro') {
    const previewTarget = Math.max(
      1,
      Math.min(3, 1.6 + abilityGlobal * 0.7 + Math.min(1.0, (sessionNo - 1) * 0.03))
    )
    return (
      <div className="py-6">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="grid place-items-center h-9 w-9 rounded-xl bg-primary-soft text-primary">
            <IconTimer size={19} />
          </span>
          <h1 className="text-xl font-bold">적응형 모의고사</h1>
          <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-surface-2 text-subtle font-medium">
            적응형
          </span>
        </div>
        <p className="text-sm text-muted mb-6">
          매 회차가 당신의 능력과 약점에 맞춰 새로 구성됩니다. 풀수록 약점 위주로, 난이도는
          점진적으로 올라갑니다.
        </p>

        <div className="rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] p-6">
          <dl className="grid grid-cols-3 gap-3 text-center">
            <Stat label="이번 회차" value={hydrated ? `${sessionNo}회차` : '—'} />
            <Stat label="현재 능력" value={hydrated ? `${abilityPct(abilityGlobal)}%` : '—'} />
            <Stat label="목표 난이도" value={hydrated ? difficultyLabel(previewTarget) : '—'} />
          </dl>

          {/* 과목별 숙련도 */}
          <div className="mt-5 space-y-2">
            <p className="text-xs font-semibold text-subtle">과목별 숙련도</p>
            {Object.values(SUBJECT_MAP).map((meta) => {
              const m = Math.round((mastery[meta.key] ?? 0.5) * 100)
              return (
                <div key={meta.key}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted">{meta.label}</span>
                    <span className="tabular text-subtle">{hydrated ? `${m}%` : '—'}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: hydrated ? `${m}%` : '0%' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <ul className="mt-5 space-y-2 text-sm text-muted">
            <li className="flex gap-2"><span className="text-primary">·</span> {EXAM_SIZE}문항 · 약 {Math.round((EXAM_SIZE * SECONDS_PER_QUESTION) / 60)}분 · 합격선 {PASS_SCORE}점</li>
            <li className="flex gap-2"><span className="text-primary">·</span> 약한 과목이 더 많이, 직전 회차와 다른 문항으로 출제됩니다.</li>
            <li className="flex gap-2"><span className="text-primary">·</span> 채점 후 약점 단원의 교과서로 바로 복습할 수 있습니다.</li>
            <li className="flex gap-2 text-subtle"><span>·</span> 학습용 예상문제로 구성되었습니다.</li>
          </ul>
          <button
            type="button"
            onClick={start}
            className="mt-6 w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-on-primary font-semibold text-sm transition-colors cursor-pointer"
          >
            {hydrated ? `${sessionNo}회차 시험 시작` : '시험 시작'}
          </button>
        </div>
      </div>
    )
  }

  // ───────── result ─────────
  if (phase === 'result' && analysis && exam) {
    const a = analysis
    const scorePct = Math.round(a.rate * 100)
    const deltaPct = abilityPct(a.abilityAfter) - abilityPct(a.abilityBefore)
    const reviewParts = a.reviewParts
      .map((id) => getPart(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))

    return (
      <div className="py-6">
        <div className="rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] p-7 text-center">
          <span
            className={`inline-grid place-items-center h-12 w-12 rounded-2xl ${
              a.passed ? 'bg-primary-soft text-primary' : 'bg-danger-soft text-danger'
            }`}
          >
            <IconTarget size={24} />
          </span>
          <p className="mt-3 text-sm text-muted">{exam.sessionNo}회차 결과</p>
          <p className={`tabular mt-1 text-5xl font-bold ${a.passed ? 'text-primary' : 'text-danger'}`}>
            {scorePct}
            <span className="text-2xl">점</span>
          </p>
          <p
            className={`mt-3 inline-block px-3 py-1 rounded-full text-xs font-bold ${
              a.passed ? 'bg-primary-soft text-primary' : 'bg-danger-soft text-danger'
            }`}
          >
            {a.passed ? '합격 기준 통과' : '합격 기준 미달'}
          </p>
          <p className="mt-2 text-sm text-muted tabular">
            {a.total}문항 중 {a.score}문항 정답
          </p>
          {/* 능력 변화 */}
          <div className="mt-4 inline-flex items-center gap-2 text-xs text-muted tabular">
            <span>능력 {abilityPct(a.abilityBefore)}%</span>
            <IconChevronRight size={13} className="text-subtle" />
            <span className="font-semibold text-foreground">{abilityPct(a.abilityAfter)}%</span>
            {deltaPct !== 0 && (
              <span className={deltaPct > 0 ? 'text-success' : 'text-danger'}>
                {deltaPct > 0 ? `+${deltaPct}` : deltaPct}%p
              </span>
            )}
          </div>
        </div>

        {/* 과목별 분석 */}
        <h3 className="text-sm font-bold mt-6 mb-3">과목별 분석</h3>
        <div className="space-y-2.5">
          {a.bySubject.map((s) => {
            const p = Math.round(s.rate * 100)
            return (
              <div key={s.subject} className="rounded-2xl border border-border bg-surface p-3.5">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-medium">{SUBJECT_MAP[s.subject].label}</span>
                  <span className="tabular text-xs text-subtle">
                    {s.correct}/{s.total} · {p}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                  <div
                    className={`h-full rounded-full ${p >= PASS_SCORE ? 'bg-primary' : 'bg-danger'}`}
                    style={{ width: `${p}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* 난이도별 분석 */}
        {a.byDifficulty.length > 0 && (
          <>
            <h3 className="text-sm font-bold mt-6 mb-3">난이도별 분석</h3>
            <div className="grid grid-cols-3 gap-2.5">
              {a.byDifficulty.map((d) => {
                const p = Math.round(d.rate * 100)
                return (
                  <div key={d.difficulty} className="rounded-2xl border border-border bg-surface p-3 text-center">
                    <p className="text-xs text-subtle">{DIFF_LABEL[d.difficulty] ?? d.difficulty}</p>
                    <p className="tabular text-lg font-bold mt-0.5">{p}%</p>
                    <p className="tabular text-[11px] text-subtle">{d.correct}/{d.total}</p>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* 약점 단원 복습 */}
        {reviewParts.length > 0 ? (
          <>
            <h3 className="text-sm font-bold mt-6 mb-1">약점 단원 복습</h3>
            <p className="text-xs text-muted mb-3">틀린 부분과 약한 과목의 교과서 단원입니다. 복습 후 다음 회차로.</p>
            <div className="space-y-2">
              {reviewParts.map((p) => (
                <Link
                  key={p.id}
                  href={`/textbook/${p.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 hover:border-primary hover:bg-primary-soft transition-colors"
                >
                  <span className="tabular grid place-items-center h-8 w-8 shrink-0 rounded-lg bg-primary-soft text-primary text-sm font-bold">
                    {p.no}
                  </span>
                  <span className="flex-1 text-sm font-medium">PART {p.no}. {p.title}</span>
                  <IconChevronRight size={16} className="text-subtle" />
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-6 rounded-2xl bg-primary-soft p-4 text-sm text-primary font-medium text-center">
            모든 과목이 합격선을 넘었습니다. 더 어려운 다음 회차에 도전해 보세요.
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={nextSession}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-sm font-semibold transition-colors cursor-pointer"
          >
            <IconRefresh size={16} />
            복습하고 다음 회차
          </button>
          <Link
            href="/study/wrong-answers"
            className="flex-1 text-center px-5 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-surface-2 transition-colors"
          >
            오답노트 보기
          </Link>
        </div>

        {/* AI 약점 문항 보충 (L2) */}
        <div className="mt-3 rounded-2xl border border-dashed border-border-strong p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <IconSparkles size={15} className="text-primary" /> AI 약점 문항 보충
              </p>
              <p className="text-xs text-muted mt-0.5">약점 과목을 AI가 새 문항으로 생성해 다음 회차부터 추가합니다.</p>
            </div>
            <button
              type="button"
              disabled={aiBusy}
              onClick={() =>
                fetchAI(
                  a.weakSubjects.length ? a.weakSubjects : (['hygiene', 'anatomy', 'ink_material', 'law'] as SubjectKey[]),
                  exam.targetDifficulty,
                  exam.questions.map((q) => q.question)
                )
              }
              className="shrink-0 px-4 py-2.5 rounded-xl bg-surface-2 hover:bg-primary-soft text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              {aiBusy ? '생성 중…' : 'AI 보충'}
            </button>
          </div>
          {aiMsg && <p className="mt-2 text-xs text-subtle">{aiMsg}</p>}
        </div>

        {/* 문항별 해설 */}
        <h3 className="text-sm font-bold mt-8 mb-3">문항별 해설</h3>
        <ol className="space-y-3">
          {exam.questions.map((q, i) => {
            const pickIdx = answers[i]
            const ok = pickIdx === q.answer
            return (
              <li key={q.id} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 grid place-items-center h-5 w-5 shrink-0 rounded-full text-white ${
                      ok ? 'bg-success' : 'bg-danger'
                    }`}
                  >
                    {ok ? <IconCheck size={12} /> : <IconX size={12} />}
                  </span>
                  <p className="font-medium text-[0.95rem] leading-relaxed">
                    <span className="tabular text-subtle mr-1">{i + 1}.</span>
                    {q.question}
                  </p>
                </div>
                <p className="mt-2 ml-7 text-xs text-muted">
                  정답 {q.answer + 1}. {q.choices[q.answer]}
                  {pickIdx !== null && !ok && (
                    <>
                      {' · '}내 답 {pickIdx + 1}. {q.choices[pickIdx]}
                    </>
                  )}
                  {pickIdx === null && ' · 미응답'}
                </p>
                <p className="prose-read mt-2 ml-7 text-[0.9rem] text-muted rounded-xl bg-surface-2 p-3">
                  {q.explanation}
                </p>
              </li>
            )
          })}
        </ol>
      </div>
    )
  }

  // ───────── running ─────────
  if (!exam) return null
  const questions = exam.questions
  const current = questions[idx]
  const answeredCount = answers.filter((x) => x !== null).length
  const lowTime = remaining <= 60

  return (
    <div className="px-4 py-6">
      <div className="sticky top-16 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5 mb-4 bg-background/95 backdrop-blur-md border-b border-border flex items-center justify-between">
        <span className="tabular text-sm text-muted">
          {answeredCount}/{questions.length} 응답 · {exam.sessionNo}회차
        </span>
        <span
          className={`tabular flex items-center gap-1.5 font-bold text-lg ${
            lowTime ? 'text-danger' : 'text-foreground'
          }`}
        >
          <IconClock size={18} className={lowTime ? 'animate-pulse' : ''} />
          {fmt(remaining)}
        </span>
      </div>

      <div className="grid grid-cols-10 gap-1.5 mb-4">
        {questions.map((_, i) => {
          const answered = answers[i] !== null
          const isCurrent = i === idx
          return (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              className={`tabular aspect-square rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                isCurrent
                  ? 'bg-primary text-on-primary'
                  : answered
                    ? 'bg-primary-soft text-primary'
                    : 'bg-surface-2 text-subtle hover:text-foreground'
              }`}
            >
              {i + 1}
            </button>
          )
        })}
      </div>

      {current && (
        <div className="rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs px-2.5 py-1 rounded-full bg-surface-2 text-muted font-medium">
              {SUBJECT_MAP[current.subject].label}
            </span>
            <span className="tabular text-xs text-subtle">
              {idx + 1} / {questions.length}
            </span>
          </div>
          <p className="prose-read font-medium">{current.question}</p>
          <div className="mt-5 space-y-2.5">
            {current.choices.map((choice, ci) => {
              const isPicked = answers[idx] === ci
              return (
                <button
                  key={ci}
                  type="button"
                  onClick={() => pick(ci)}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    isPicked ? 'border-primary bg-primary-soft' : 'border-border hover:border-primary'
                  }`}
                >
                  <span
                    className={`mt-0.5 grid place-items-center h-6 w-6 shrink-0 rounded-lg text-xs font-bold ${
                      isPicked ? 'bg-primary text-on-primary' : 'bg-surface-2 text-muted'
                    }`}
                  >
                    {ci + 1}
                  </span>
                  <span className="flex-1 text-[0.95rem] leading-relaxed">{choice}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="px-4 py-3 rounded-xl border border-border text-sm font-medium text-muted disabled:opacity-40 hover:bg-surface-2 transition-colors cursor-pointer disabled:cursor-default"
        >
          이전
        </button>
        {idx < questions.length - 1 ? (
          <button
            type="button"
            onClick={() => setIdx((i) => Math.min(questions.length - 1, i + 1))}
            className="flex-1 px-4 py-3 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-sm font-semibold transition-colors cursor-pointer"
          >
            다음
          </button>
        ) : (
          <button
            type="button"
            onClick={() => finish(exam, answers)}
            className="flex-1 px-4 py-3 rounded-xl bg-success hover:opacity-90 text-white text-sm font-semibold transition-opacity cursor-pointer"
          >
            제출하고 채점
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => finish(exam, answers)}
        className="mt-3 w-full text-xs text-subtle hover:text-foreground transition-colors cursor-pointer"
      >
        지금 제출하기
      </button>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-subtle">{label}</dt>
      <dd className="tabular text-2xl font-bold mt-0.5">{value}</dd>
    </div>
  )
}
