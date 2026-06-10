'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  QUESTIONS,
  SUBJECTS,
  SUBJECT_MAP,
  getQuestionById,
  type SubjectKey,
} from '@/data/questions'
import { useBookmarks } from '@/lib/bookmarks'
import { useHydrated } from '@/lib/progress'
import { IconArrowRight, IconRefresh, SUBJECT_ICON } from '@/components/icons'
import { chipClass } from '@/components/ui'

type Source = 'all' | SubjectKey | 'bookmarks'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const ALL_IDS = QUESTIONS.map((q) => q.id)

export function Flashcards() {
  const hydrated = useHydrated()
  const bookmarkIds = useBookmarks()
  const [source, setSource] = useState<Source>('all')
  // SSR/첫 렌더는 안정 순서(셔플 X) → 하이드레이션 불일치 방지, 마운트 후 셔플
  const [order, setOrder] = useState<string[]>(ALL_IDS)
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    // 마운트 후 클라이언트에서만 셔플(SSR/클라 불일치 방지) — 의도된 패턴
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrder(shuffle(ALL_IDS))
  }, [])

  function poolFor(s: Source): string[] {
    if (s === 'all') return ALL_IDS
    if (s === 'bookmarks') return bookmarkIds.slice()
    return QUESTIONS.filter((q) => q.subject === s).map((q) => q.id)
  }

  function applySource(s: Source) {
    setSource(s)
    setOrder(shuffle(poolFor(s)))
    setIdx(0)
    setFlipped(false)
  }

  const cards = useMemo(() => order.map(getQuestionById).filter(Boolean), [order])
  const total = cards.length
  const cur = cards[idx]

  function reshuffle() {
    setOrder((o) => shuffle(o))
    setIdx(0)
    setFlipped(false)
  }
  function go(d: number) {
    const n = idx + d
    if (n >= 0 && n < total) {
      setIdx(n)
      setFlipped(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <Chip on={source === 'all'} onClick={() => applySource('all')}>
          전체
        </Chip>
        {SUBJECTS.map((s) => (
          <Chip key={s.key} on={source === s.key} onClick={() => applySource(s.key)}>
            {s.label}
          </Chip>
        ))}
        <Chip on={source === 'bookmarks'} onClick={() => applySource('bookmarks')}>
          북마크
        </Chip>
      </div>

      {total === 0 || !cur ? (
        <div className="rounded-2xl border border-border bg-surface p-10 text-center text-sm text-muted">
          {source === 'bookmarks' && (!hydrated || bookmarkIds.length === 0)
            ? '북마크한 문제가 없습니다. 문제를 북마크하면 카드로 복습할 수 있어요.'
            : '카드가 없습니다.'}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-muted mb-2">
            <span className="tabular">
              {idx + 1} / {total}
            </span>
            <button
              type="button"
              onClick={reshuffle}
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
            >
              <IconRefresh size={13} />
              섞기
            </button>
          </div>

          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            aria-label={flipped ? '문제 보기' : '정답·해설 보기'}
            className="w-full text-left rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] p-6 min-h-[220px] flex flex-col justify-center cursor-pointer hover:border-primary transition-colors"
          >
            {(() => {
              const meta = SUBJECT_MAP[cur.subject]
              const Icon = SUBJECT_ICON[cur.subject]
              return (
                <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-surface-2 text-muted self-start mb-3">
                  <Icon size={13} />
                  {meta.label}
                </span>
              )
            })()}
            {!flipped ? (
              <>
                <p className="prose-read font-medium text-[1.05rem]">{cur.question}</p>
                <p className="text-xs text-subtle mt-4">카드를 눌러 정답·해설 보기</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-success">
                  정답 {cur.answer + 1}. {cur.choices[cur.answer]}
                </p>
                <p className="prose-read mt-3 text-[0.95rem] text-muted">{cur.explanation}</p>
              </>
            )}
          </button>

          <div className="mt-4 flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={idx === 0}
              className="px-4 py-3 rounded-xl border border-border text-sm font-medium text-muted disabled:opacity-40 hover:bg-surface-2 transition-colors cursor-pointer disabled:cursor-default"
            >
              이전
            </button>
            <button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              className="flex-1 px-4 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-surface-2 transition-colors cursor-pointer"
            >
              뒤집기
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={idx >= total - 1}
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-40 text-on-primary text-sm font-semibold transition-colors cursor-pointer disabled:cursor-default"
            >
              다음
              <IconArrowRight size={15} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={chipClass(on)}>
      {children}
    </button>
  )
}
