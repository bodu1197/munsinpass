'use client'

import { useState } from 'react'
import { CHECKLIST } from '@/data/checklist'
import { useHydrated } from '@/lib/progress'
import { IconCheck } from '@/components/icons'

const STORAGE_KEY = 'munshinpass:checklist:v1'

function loadChecked(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Record<string, boolean>
  } catch {
    /* ignore */
  }
  return {}
}

export function ChecklistBoard() {
  const hydrated = useHydrated()
  const [checked, setChecked] = useState<Record<string, boolean>>(loadChecked)
  const [memorize, setMemorize] = useState(false)
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})

  function persist(next: Record<string, boolean>) {
    setChecked(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }

  function toggle(id: string) {
    persist({ ...checked, [id]: !checked[id] })
  }

  function resetAll() {
    persist({})
    setRevealed({})
  }

  const allItems = CHECKLIST.flatMap((g) => g.steps.map((_, i) => `${g.key}-${i}`))
  const doneCount = allItems.filter((id) => checked[id]).length
  const totalCount = allItems.length
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  if (!hydrated) {
    return <div className="h-64 animate-pulse rounded-2xl bg-surface-2" />
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-1.5 text-sm">
          <span className="tabular font-semibold">
            {doneCount}/{totalCount}
          </span>
          <span className="text-subtle">완료 · {pct}%</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setMemorize((m) => !m)
              setRevealed({})
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              memorize
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface text-muted border-border hover:text-foreground'
            }`}
          >
            암기 모드 {memorize ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            onClick={resetAll}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border border-border text-muted hover:bg-surface-2 hover:text-foreground transition-colors cursor-pointer"
          >
            초기화
          </button>
        </div>
      </div>

      <div className="h-1.5 w-full rounded-full bg-border overflow-hidden mb-6">
        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      <div className="space-y-4">
        {CHECKLIST.map((group) => {
          const groupItems = group.steps.map((_, i) => `${group.key}-${i}`)
          const groupDone = groupItems.filter((id) => checked[id]).length
          return (
            <div key={group.key} className="rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
                <h2 className="font-bold text-[0.95rem]">{group.title}</h2>
                <span className="tabular ml-auto text-xs text-subtle">
                  {groupDone}/{group.steps.length}
                </span>
              </div>
              <ol className="divide-y divide-border">
                {group.steps.map((step, i) => {
                  const id = `${group.key}-${i}`
                  const isChecked = !!checked[id]
                  const isHidden = memorize && !revealed[id] && !isChecked
                  return (
                    <li key={id} className="flex items-start gap-3 px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => toggle(id)}
                        aria-pressed={isChecked}
                        aria-label={`${i + 1}번 단계 체크`}
                        className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg border transition-colors cursor-pointer ${
                          isChecked
                            ? 'bg-primary border-primary text-on-primary'
                            : 'border-border-strong text-transparent hover:border-primary'
                        }`}
                      >
                        <IconCheck size={14} />
                      </button>
                      <span className="tabular text-xs text-subtle mt-1 w-4 shrink-0">{i + 1}</span>
                      {isHidden ? (
                        <button
                          type="button"
                          onClick={() => setRevealed((r) => ({ ...r, [id]: true }))}
                          className="flex-1 text-left text-sm text-subtle italic cursor-pointer"
                        >
                          (탭하여 보기)
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggle(id)}
                          className={`flex-1 text-left text-[0.95rem] leading-relaxed cursor-pointer ${
                            isChecked ? 'text-subtle line-through' : 'text-foreground'
                          }`}
                        >
                          {step}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ol>
            </div>
          )
        })}
      </div>
    </div>
  )
}
