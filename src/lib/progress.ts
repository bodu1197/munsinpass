'use client'

import { useCallback, useSyncExternalStore } from 'react'
import {
  QUESTIONS,
  SUBJECTS,
  getSubjectCount,
  type SubjectKey,
} from '@/data/questions'

const STORAGE_KEY = 'munshinpass:progress:v1'
const EVENT = 'munshinpass:progress-change'

export interface AnswerRecord {
  questionId: string
  subject: SubjectKey
  correct: boolean
  /** epoch ms (로컬 시각) */
  at: number
}

interface ProgressData {
  answers: AnswerRecord[]
}

function isBrowser() {
  return typeof window !== 'undefined'
}

function read(): ProgressData {
  if (!isBrowser()) return { answers: [] }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { answers: [] }
    const parsed = JSON.parse(raw) as ProgressData
    if (!parsed || !Array.isArray(parsed.answers)) return { answers: [] }
    return parsed
  } catch {
    return { answers: [] }
  }
}

function write(data: ProgressData) {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    window.dispatchEvent(new CustomEvent(EVENT))
  } catch {
    // 저장 실패(용량 초과 등)는 조용히 무시
  }
}

/** 한 문제 풀이 결과를 기록 */
export function recordAnswer(record: Omit<AnswerRecord, 'at'>) {
  const data = read()
  data.answers.push({ ...record, at: Date.now() })
  write(data)
}

export function getAnswers(): AnswerRecord[] {
  return read().answers
}

/** 답안 식별 키(초 단위) — 로컬·서버 중복 판별용 */
export function answerKey(a: AnswerRecord): string {
  return a.questionId + '|' + Math.floor(a.at / 1000)
}

/** 외부(서버) 답안을 로컬과 병합(중복 제거 후 저장). 병합된 전체 배열 반환 */
export function mergeAnswers(incoming: AnswerRecord[]): AnswerRecord[] {
  const data = read()
  if (!incoming.length) return data.answers
  const seen = new Set(data.answers.map(answerKey))
  let changed = false
  for (const a of incoming) {
    if (!a || !a.questionId) continue
    const k = answerKey(a)
    if (seen.has(k)) continue
    seen.add(k)
    data.answers.push(a)
    changed = true
  }
  if (changed) {
    data.answers.sort((x, y) => x.at - y.at)
    write(data)
  }
  return data.answers
}

/** 같은 날짜(로컬)인지 비교 */
function isToday(ts: number) {
  const d = new Date(ts)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

/** 각 문제의 "가장 최근" 풀이 결과 맵 */
function latestByQuestion(answers: AnswerRecord[]): Map<string, AnswerRecord> {
  const map = new Map<string, AnswerRecord>()
  for (const a of answers) {
    const prev = map.get(a.questionId)
    if (!prev || a.at >= prev.at) map.set(a.questionId, a)
  }
  return map
}

export interface SubjectStat {
  subject: SubjectKey
  attempted: number
  correct: number
  total: number
}

export interface ProgressStats {
  totalAttempts: number
  uniqueAttempted: number
  solvedToday: number
  correctRate: number
  bySubject: SubjectStat[]
  wrongQuestionIds: string[]
}

export function computeStats(answers: AnswerRecord[]): ProgressStats {
  const latest = latestByQuestion(answers)

  const totalAttempts = answers.length
  const correctAttempts = answers.filter((a) => a.correct).length
  const correctRate =
    totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0

  const todayIds = new Set(answers.filter((a) => isToday(a.at)).map((a) => a.questionId))

  const bySubject: SubjectStat[] = SUBJECTS.map((s) => {
    const subjQuestionIds = QUESTIONS.filter((q) => q.subject === s.key).map((q) => q.id)
    let attempted = 0
    let correct = 0
    for (const qid of subjQuestionIds) {
      const rec = latest.get(qid)
      if (rec) {
        attempted += 1
        if (rec.correct) correct += 1
      }
    }
    return { subject: s.key, attempted, correct, total: getSubjectCount(s.key) }
  })

  const wrongQuestionIds = [...latest.values()]
    .filter((a) => !a.correct)
    .map((a) => a.questionId)

  return {
    totalAttempts,
    uniqueAttempted: latest.size,
    solvedToday: todayIds.size,
    correctRate,
    bySubject,
    wrongQuestionIds,
  }
}

export function getStats(): ProgressStats {
  return computeStats(getAnswers())
}

export function getWrongQuestionIds(): string[] {
  return getStats().wrongQuestionIds
}

export function resetProgress() {
  write({ answers: [] })
}

// ── React 구독용 (useSyncExternalStore) ──
const EMPTY_STATS: ProgressStats = computeStats([])
const emptySubscribe = () => () => {}

// raw 문자열이 바뀔 때만 새 stats 객체를 만들어 참조 안정성을 보장(무한 렌더 방지)
let cachedRaw: string | null = null
let cachedStats: ProgressStats = EMPTY_STATS

function statsSnapshot(): ProgressStats {
  if (!isBrowser()) return EMPTY_STATS
  const raw = window.localStorage.getItem(STORAGE_KEY) ?? ''
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedStats = computeStats(read().answers)
  }
  return cachedStats
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener(EVENT, cb)
    window.removeEventListener('storage', cb)
  }
}

/** 서버에서는 false, 클라이언트 마운트 후 true (hydration-safe, setState 없음) */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

/**
 * 진도 통계를 구독하는 훅. localStorage 변경(같은 탭/다른 탭)에 반응합니다.
 * SSR/첫 렌더에서는 빈 통계를 반환하고, 마운트 후 실제 값으로 채워집니다.
 */
export function useProgress(): { stats: ProgressStats; hydrated: boolean; reset: () => void } {
  const stats = useSyncExternalStore(subscribe, statsSnapshot, () => EMPTY_STATS)
  const hydrated = useHydrated()
  const reset = useCallback(() => resetProgress(), [])
  return { stats, hydrated, reset }
}
