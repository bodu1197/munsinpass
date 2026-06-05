// 적응형 출제 엔진 (L1)
//
// 시험을 미리 만들지 않고, 매 회차를 수험생의 능력(θ)·약점·회차 램프·스페이싱으로
// 즉석 구성한다. 순수 함수 + localStorage 회차 상태. (브라우저에서만 호출)

import {
  QUESTIONS,
  SUBJECTS,
  SUBJECT_TO_PARTS,
  getDifficulty,
  getTopicKey,
  type Question,
  type SubjectKey,
} from '@/data/questions'
import { subjectExamWeights, partsForTopic } from '@/data/blueprint'
import { getAnswers, type AnswerRecord } from '@/lib/progress'

const SUBJECT_KEYS: SubjectKey[] = SUBJECTS.map((s) => s.key)

/** 난이도(1·2·3) → 문항 난이도 모수 b */
const B: Record<number, number> = { 1: -1, 2: 0, 3: 1 }
const K = 0.18 // 능력 갱신 학습률
const PASS_RATE = 0.6 // 합격선 60%

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x))
}
function clamp(min: number, max: number, v: number) {
  return Math.max(min, Math.min(max, v))
}

function emptySubjectRecord(): Record<SubjectKey, number> {
  return { hygiene: 0, anatomy: 0, ink_material: 0, law: 0 }
}

// ───────────────────────── 능력 추정 ─────────────────────────

export interface Ability {
  /** 전체 능력 θ (대략 -2 ~ 2) */
  global: number
  bySubject: Record<SubjectKey, number>
  attemptsBySubject: Record<SubjectKey, number>
  /** 과목별 숙련도 0~1 (= sigmoid θ) */
  masteryBySubject: Record<SubjectKey, number>
}

/** 풀이 기록을 시간순 재생하며 과목별 능력 θ를 추정 */
export function estimateAbility(answers: AnswerRecord[] = getAnswers()): Ability {
  const theta = emptySubjectRecord()
  const counts = emptySubjectRecord()
  const sorted = [...answers].sort((a, b) => a.at - b.at)

  for (const a of sorted) {
    const subj = a.subject
    if (!SUBJECT_KEYS.includes(subj)) continue
    const b = B[getDifficulty(a.questionId)] ?? 0
    const expected = sigmoid(theta[subj] - b)
    theta[subj] += K * ((a.correct ? 1 : 0) - expected)
    counts[subj] += 1
  }

  const mastery = emptySubjectRecord()
  let sum = 0
  for (const k of SUBJECT_KEYS) {
    theta[k] = clamp(-2, 2, theta[k])
    mastery[k] = sigmoid(theta[k])
    sum += theta[k]
  }
  return {
    global: sum / SUBJECT_KEYS.length,
    bySubject: theta,
    attemptsBySubject: counts,
    masteryBySubject: mastery,
  }
}

// ───────────────────────── 회차 상태 (localStorage) ─────────────────────────

const EXAM_KEY = 'munshinpass:exam:v1'

export interface SessionResult {
  sessionNo: number
  at: number
  score: number
  total: number
  targetDifficulty: number
  abilityBefore: number
  abilityAfter: number
}

interface SessionState {
  completed: number
  lastIds: string[]
  history: SessionResult[]
}

function readSession(): SessionState {
  if (typeof window === 'undefined') return { completed: 0, lastIds: [], history: [] }
  try {
    const raw = window.localStorage.getItem(EXAM_KEY)
    if (!raw) return { completed: 0, lastIds: [], history: [] }
    const parsed = JSON.parse(raw) as SessionState
    return {
      completed: parsed.completed ?? 0,
      lastIds: Array.isArray(parsed.lastIds) ? parsed.lastIds : [],
      history: Array.isArray(parsed.history) ? parsed.history : [],
    }
  } catch {
    return { completed: 0, lastIds: [], history: [] }
  }
}

function writeSession(state: SessionState) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(EXAM_KEY, JSON.stringify(state))
  } catch {
    // 무시
  }
}

export function getCompletedSessions(): number {
  return readSession().completed
}

export function getSessionHistory(): SessionResult[] {
  return readSession().history
}

/** 회차 종료 기록: 완료 수 증가 + 직전 문항 id 저장(스페이싱) + 이력 누적 */
export function recordSession(input: {
  questionIds: string[]
  score: number
  total: number
  targetDifficulty: number
  abilityBefore: number
  abilityAfter: number
}) {
  const state = readSession()
  const sessionNo = state.completed + 1
  const result: SessionResult = {
    sessionNo,
    at: Date.now(),
    score: input.score,
    total: input.total,
    targetDifficulty: input.targetDifficulty,
    abilityBefore: input.abilityBefore,
    abilityAfter: input.abilityAfter,
  }
  writeSession({
    completed: sessionNo,
    lastIds: input.questionIds,
    history: [...state.history, result].slice(-50),
  })
}

// ───────────────────────── 출제 생성 ─────────────────────────

export interface GeneratedExam {
  sessionNo: number
  /** 1~3 (하~상) 연속값 */
  targetDifficulty: number
  questions: Question[]
  blueprint: { subject: SubjectKey; count: number }[]
  ability: Ability
}

function lastSeenSet(answers: AnswerRecord[]): Set<string> {
  return new Set(answers.map((a) => a.questionId))
}

function itemWeight(
  q: Question,
  target: number,
  recent: Set<string>,
  seen: Set<string>
): number {
  const b = B[getDifficulty(q.id)] ?? 0
  // 목표 난이도 근접 가우시안
  let w = Math.exp(-((b - target) ** 2) / (2 * 0.6 * 0.6)) + 0.05
  if (recent.has(q.id))
    w *= 0.03 // 직전 회차 문항 강한 패널티
  else if (seen.has(q.id)) w *= 0.45 // 과거에 본 문항 약한 패널티
  return w
}

/** 가중치 기반 무복원 추출 */
function weightedPick<T>(pool: T[], n: number, weightFn: (t: T) => number): T[] {
  const items = pool.map((t) => ({ t, w: Math.max(1e-6, weightFn(t)) }))
  const out: T[] = []
  const take = Math.min(n, items.length)
  for (let i = 0; i < take; i++) {
    const total = items.reduce((s, it) => s + it.w, 0)
    let r = Math.random() * total
    let idx = 0
    for (let j = 0; j < items.length; j++) {
      r -= items[j].w
      if (r <= 0) {
        idx = j
        break
      }
    }
    out.push(items[idx].t)
    items.splice(idx, 1)
  }
  return out
}

function allocate(weights: Record<SubjectKey, number>, size: number): Record<SubjectKey, number> {
  const keys = SUBJECT_KEYS
  const sum = keys.reduce((s, k) => s + weights[k], 0) || 1
  const raw = keys.map((k) => ({ k, v: (weights[k] / sum) * size }))
  const counts = emptySubjectRecord()
  let assigned = 0
  for (const { k, v } of raw) {
    counts[k] = Math.floor(v)
    assigned += counts[k]
  }
  const rem = raw
    .map(({ k, v }) => ({ k, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac)
  let i = 0
  while (assigned < size && rem.length > 0) {
    counts[rem[i % rem.length].k] += 1
    assigned++
    i++
  }
  // 커버리지: size가 과목 수 이상이면 모든 과목 최소 1
  if (size >= keys.length) {
    for (const k of keys) {
      if (counts[k] === 0) {
        const max = keys.reduce((m, x) => (counts[x] > counts[m] ? x : m), keys[0])
        if (counts[max] > 1) {
          counts[max] -= 1
          counts[k] = 1
        }
      }
    }
  }
  return counts
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 다음 회차 시험을 생성 */
export function generateExam(size = 15): GeneratedExam {
  const answers = getAnswers()
  const ability = estimateAbility(answers)
  const session = readSession()
  const sessionNo = session.completed + 1

  // 목표 난이도: 능력 + 회차 램프 (정답률 60~75% 도전구간)
  const target = clamp(1, 3, 1.6 + ability.global * 0.7 + Math.min(1.0, (sessionNo - 1) * 0.03))

  // 과목 배분: 출제기준 비중 × 약점 가중
  const examW = subjectExamWeights()
  const weights = emptySubjectRecord()
  for (const s of SUBJECT_KEYS) {
    const weakness = 1 - ability.masteryBySubject[s] // 0~1
    weights[s] = examW[s] * (0.6 + 0.8 * weakness)
  }
  const counts = allocate(weights, size)

  const recent = new Set(session.lastIds)
  const seen = lastSeenSet(answers)

  const picked: Question[] = []
  for (const s of SUBJECT_KEYS) {
    const need = counts[s]
    if (need <= 0) continue
    const pool = QUESTIONS.filter((q) => q.subject === s)
    picked.push(...weightedPick(pool, need, (q) => itemWeight(q, target, recent, seen)))
  }

  return {
    sessionNo,
    targetDifficulty: target,
    questions: shuffle(picked),
    blueprint: SUBJECT_KEYS.map((s) => ({ subject: s, count: counts[s] })).filter((b) => b.count > 0),
    ability,
  }
}

// ───────────────────────── 결과 분석 ─────────────────────────

export interface SubjectScore {
  subject: SubjectKey
  correct: number
  total: number
  rate: number
}
export interface DifficultyScore {
  difficulty: number
  correct: number
  total: number
  rate: number
}

export interface ExamAnalysis {
  score: number
  total: number
  rate: number
  passed: boolean
  bySubject: SubjectScore[]
  byDifficulty: DifficultyScore[]
  abilityBefore: number
  abilityAfter: number
  abilityDelta: number
  /** 정답률이 합격선 미만인 약점 과목(낮은 순) */
  weakSubjects: SubjectKey[]
  /** 복습 권장 교과서 PART id (중복 제거) */
  reviewParts: string[]
}

export function analyzeResult(
  questions: Question[],
  correctById: Record<string, boolean>,
  beforeAnswers: AnswerRecord[] = []
): ExamAnalysis {
  const total = questions.length
  let score = 0

  const subjAgg = new Map<SubjectKey, { correct: number; total: number }>()
  const diffAgg = new Map<number, { correct: number; total: number }>()
  const wrongTopics: string[] = []

  for (const q of questions) {
    const ok = !!correctById[q.id]
    if (ok) score += 1

    const sa = subjAgg.get(q.subject) ?? { correct: 0, total: 0 }
    sa.total += 1
    if (ok) sa.correct += 1
    subjAgg.set(q.subject, sa)

    const d = getDifficulty(q.id)
    const da = diffAgg.get(d) ?? { correct: 0, total: 0 }
    da.total += 1
    if (ok) da.correct += 1
    diffAgg.set(d, da)

    if (!ok) {
      const t = getTopicKey(q.id)
      if (t) wrongTopics.push(t)
    }
  }

  const bySubject: SubjectScore[] = [...subjAgg.entries()].map(([subject, v]) => ({
    subject,
    correct: v.correct,
    total: v.total,
    rate: v.total ? v.correct / v.total : 0,
  }))

  const byDifficulty: DifficultyScore[] = [...diffAgg.entries()]
    .map(([difficulty, v]) => ({
      difficulty,
      correct: v.correct,
      total: v.total,
      rate: v.total ? v.correct / v.total : 0,
    }))
    .sort((a, b) => a.difficulty - b.difficulty)

  const weakSubjects = bySubject
    .filter((s) => s.rate < PASS_RATE)
    .sort((a, b) => a.rate - b.rate)
    .map((s) => s.subject)

  // 복습 PART: 약점 과목의 PART + 오답 토픽의 PART (중복 제거)
  const reviewParts: string[] = []
  const pushPart = (p: string) => {
    if (!reviewParts.includes(p)) reviewParts.push(p)
  }
  for (const t of wrongTopics) partsForTopic(t).forEach(pushPart)
  for (const s of weakSubjects) (SUBJECT_TO_PARTS[s] ?? []).forEach(pushPart)

  // 능력 변화
  const abilityBefore = estimateAbility(beforeAnswers).global
  const baseAt = beforeAnswers.reduce((m, a) => Math.max(m, a.at), 0)
  const synthetic: AnswerRecord[] = questions.map((q, i) => ({
    questionId: q.id,
    subject: q.subject,
    correct: !!correctById[q.id],
    at: baseAt + i + 1,
  }))
  const abilityAfter = estimateAbility([...beforeAnswers, ...synthetic]).global

  return {
    score,
    total,
    rate: total ? score / total : 0,
    passed: total ? score / total >= PASS_RATE : false,
    bySubject,
    byDifficulty,
    abilityBefore,
    abilityAfter,
    abilityDelta: abilityAfter - abilityBefore,
    weakSubjects,
    reviewParts,
  }
}

export { PASS_RATE }
