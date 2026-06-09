'use client'

import { useMemo } from 'react'
import { SUBJECT_MAP, getDifficulty } from '@/data/questions'
import { useProgress, getAnswers } from '@/lib/progress'
import { SUBJECT_ICON } from '@/components/icons'

const DIFF_LABEL: Record<number, string> = { 1: '하', 2: '중', 3: '상' }

export function Stats() {
  const { stats, hydrated } = useProgress()

  const detail = useMemo(() => {
    const order = [...getAnswers()].sort((a, b) => a.at - b.at)
    const latest = new Map<string, boolean>()
    for (const a of order) latest.set(a.questionId, a.correct)
    const diff: Record<number, { att: number; cor: number }> = {
      1: { att: 0, cor: 0 },
      2: { att: 0, cor: 0 },
      3: { att: 0, cor: 0 },
    }
    for (const [qid, correct] of latest) {
      const d = getDifficulty(qid)
      diff[d].att += 1
      if (correct) diff[d].cor += 1
    }
    const recent = order.slice(-20)
    const recentRate = recent.length
      ? Math.round((recent.filter((a) => a.correct).length / recent.length) * 100)
      : 0
    return { diff, recentRate, recentN: recent.length }
    // stats 가 바뀌면(진도 변경) 재계산
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats])

  if (!hydrated) return <div className="h-60 animate-pulse rounded-2xl bg-surface-2" />

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs text-muted">전체 정답률</p>
          <p className="tabular text-2xl font-bold mt-1">
            {stats.correctRate}
            <span className="text-sm font-normal text-subtle ml-1">%</span>
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs text-muted">최근 {detail.recentN}문 정답률</p>
          <p className="tabular text-2xl font-bold mt-1">
            {detail.recentRate}
            <span className="text-sm font-normal text-subtle ml-1">%</span>
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <p className="text-xs font-semibold text-muted mb-3">과목별 숙련도(정답률)</p>
        <div className="space-y-3">
          {stats.bySubject.map((s) => {
            const meta = SUBJECT_MAP[s.subject]
            const Icon = SUBJECT_ICON[s.subject]
            const rate = s.attempted > 0 ? Math.round((s.correct / s.attempted) * 100) : 0
            return (
              <div key={s.subject}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Icon size={15} className="text-primary" />
                    {meta.label}
                  </span>
                  <span className="tabular text-subtle">
                    {s.attempted > 0 ? `${rate}% · ${s.correct}/${s.attempted}` : '미응시'}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${rate}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <p className="text-xs font-semibold text-muted mb-3">난이도별 정답률</p>
        <div className="space-y-3">
          {[1, 2, 3].map((d) => {
            const { att, cor } = detail.diff[d]
            const rate = att > 0 ? Math.round((cor / att) * 100) : 0
            return (
              <div key={d}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span>난이도 {DIFF_LABEL[d]}</span>
                  <span className="tabular text-subtle">{att > 0 ? `${rate}% · ${cor}/${att}` : '미응시'}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${rate}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
