import { describe, it, expect } from 'vitest'
import { computeReview } from './srs'
import type { AnswerRecord } from './progress'

const DAY = 86_400_000
function ans(questionId: string, correct: boolean, at: number): AnswerRecord {
  return { questionId, subject: 'hygiene', correct, at }
}

describe('computeReview (스페이스드 리피티션)', () => {
  it('답안이 없으면 복습 대상 0', () => {
    const r = computeReview([], 1_000_000)
    expect(r.dueCount).toBe(0)
    expect(r.tracked).toBe(0)
  })

  it('방금 틀린 문제는 1일 뒤 복습 대상', () => {
    const now = 10 * DAY
    const r = computeReview([ans('q1', false, now - 1.5 * DAY)], now) // streak0 → 간격1일
    expect(r.dueIds).toContain('q1')
  })

  it('연속 정답 문제는 아직 복습 대상 아님', () => {
    const now = 10 * DAY
    const answers = [
      ans('q2', true, now - 3 * DAY),
      ans('q2', true, now - 2 * DAY),
      ans('q2', true, now - 1 * DAY), // streak3 → 간격8일, 1일 경과
    ]
    const r = computeReview(answers, now)
    expect(r.dueIds).not.toContain('q2')
    expect(r.nextDueInDays).toBeGreaterThan(0)
  })

  it('틀리면 streak 리셋되어 곧 재복습', () => {
    const now = 10 * DAY
    const answers = [
      ans('q3', true, now - 5 * DAY),
      ans('q3', true, now - 4 * DAY),
      ans('q3', false, now - 1.2 * DAY), // 마지막 오답 → streak0 → 간격1일
    ]
    expect(computeReview(answers, now).dueIds).toContain('q3')
  })

  it('약한(streak 낮은) 문제를 앞에 정렬', () => {
    const now = 100 * DAY
    const answers = [
      ans('weak', false, now - 50 * DAY),
      ans('strong', true, now - 60 * DAY),
    ]
    expect(computeReview(answers, now).dueIds[0]).toBe('weak')
  })
})
