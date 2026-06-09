'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useProgress, getAnswers } from '@/lib/progress'
import { useGoal, setGoal } from '@/lib/goal'
import { IconArrowRight } from '@/components/icons'

const EXAM = new Date(2027, 11, 1)
const WD = ['일', '월', '화', '수', '목', '금', '토']

function dday() {
  const n = new Date()
  const t = new Date(n.getFullYear(), n.getMonth(), n.getDate())
  return Math.max(0, Math.ceil((EXAM.getTime() - t.getTime()) / 86_400_000))
}

export function Planner() {
  const { stats, hydrated } = useProgress()
  const goal = useGoal()

  const week = useMemo(() => {
    const answers = getAnswers()
    const now = new Date()
    const out: { label: string; count: number; today: boolean }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const s = d.getTime()
      const e = s + 86_400_000
      out.push({ label: WD[d.getDay()], count: answers.filter((a) => a.at >= s && a.at < e).length, today: i === 0 })
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats])

  if (!hydrated) return <div className="h-80 animate-pulse rounded-2xl bg-surface-2" />

  const maxCount = Math.max(1, ...week.map((d) => d.count))
  const today = stats.solvedToday
  const pct = Math.min(100, Math.round((today / goal) * 100))
  const done = today >= goal

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-primary text-on-primary p-5 flex items-center justify-between">
        <div>
          <p className="text-xs opacity-80">첫 국가시험까지</p>
          <p className="tabular text-3xl font-bold mt-1">D-{dday()}</p>
        </div>
        <p className="text-xs opacity-75">2027년 12월 기준</p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-sm">일일 목표</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setGoal(goal - 5)}
              aria-label="목표 줄이기"
              className="h-8 w-8 grid place-items-center rounded-lg border border-border text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              −
            </button>
            <span className="tabular text-lg font-bold w-20 text-center">{goal}문제</span>
            <button
              type="button"
              onClick={() => setGoal(goal + 5)}
              aria-label="목표 늘리기"
              className="h-8 w-8 grid place-items-center rounded-lg border border-border text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              +
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span>오늘 {today} / {goal}문제</span>
          <span className={done ? 'text-success font-semibold' : 'text-subtle'}>{done ? '목표 달성!' : `${pct}%`}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-border overflow-hidden">
          <div className={`h-full rounded-full transition-all ${done ? 'bg-success' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="font-semibold text-sm mb-4">최근 7일 학습량</p>
        <div className="flex items-end justify-between gap-2">
          {week.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full flex items-end justify-center h-20">
                <div
                  className={`w-full max-w-[28px] rounded-t-md transition-all ${d.today ? 'bg-primary' : 'bg-primary-soft'}`}
                  style={{ height: `${Math.max(4, (d.count / maxCount) * 80)}px` }}
                  title={`${d.count}문제`}
                />
              </div>
              <span className={`text-[11px] ${d.today ? 'text-primary font-bold' : 'text-subtle'}`}>{d.label}</span>
              <span className="tabular text-[10px] text-subtle">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      <Link
        href="/study"
        className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-sm font-semibold transition-colors"
      >
        지금 학습하기
        <IconArrowRight size={16} />
      </Link>
    </div>
  )
}
