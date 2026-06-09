'use client'

// 스페이스드 리피티션(간격 반복) — 진도 답안 기록(progress.ts)에서 "복습할 문제"를 계산.
// 문제별 연속 정답 streak 에 따라 복습 간격을 늘린다. 틀리면 streak 리셋 → 곧 다시 복습.

import { getAnswers, type AnswerRecord } from '@/lib/progress'

const DAY = 86_400_000
// streak 0,1,2,3,4,5+ 일 때의 복습 간격(일)
const INTERVALS = [1, 2, 4, 8, 16, 30]

interface QState {
  lastAt: number
  streak: number
}

function perQuestion(answers: AnswerRecord[]): Map<string, QState> {
  const byQ = new Map<string, AnswerRecord[]>()
  for (const a of answers) {
    if (!a?.questionId) continue
    const arr = byQ.get(a.questionId)
    if (arr) arr.push(a)
    else byQ.set(a.questionId, [a])
  }
  const out = new Map<string, QState>()
  for (const [qid, arr] of byQ) {
    arr.sort((x, y) => x.at - y.at)
    let streak = 0
    for (const a of arr) streak = a.correct ? streak + 1 : 0
    out.set(qid, { lastAt: arr[arr.length - 1].at, streak })
  }
  return out
}

function intervalDays(streak: number): number {
  return INTERVALS[Math.min(streak, INTERVALS.length - 1)]
}

export interface ReviewInfo {
  dueIds: string[]
  dueCount: number
  tracked: number
  nextDueInDays: number | null
}

export function computeReview(answers: AnswerRecord[], now = Date.now()): ReviewInfo {
  const states = perQuestion(answers)
  const dueIds: string[] = []
  let nextDelta = Infinity
  for (const [qid, st] of states) {
    const due = st.lastAt + intervalDays(st.streak) * DAY
    if (now >= due) dueIds.push(qid)
    else nextDelta = Math.min(nextDelta, due - now)
  }
  // streak 낮은(약한) 문제 먼저, 그다음 오래된 순
  dueIds.sort((a, b) => {
    const sa = states.get(a)!
    const sb = states.get(b)!
    if (sa.streak !== sb.streak) return sa.streak - sb.streak
    return sa.lastAt - sb.lastAt
  })
  return {
    dueIds,
    dueCount: dueIds.length,
    tracked: states.size,
    nextDueInDays: nextDelta === Infinity ? null : Math.max(1, Math.ceil(nextDelta / DAY)),
  }
}

export function getReview(): ReviewInfo {
  return computeReview(getAnswers())
}
