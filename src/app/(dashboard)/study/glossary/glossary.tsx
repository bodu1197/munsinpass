'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { GLOSSARY, GLOSSARY_CATEGORIES, type GlossaryCategory } from '@/data/glossary'

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground text-[0.95rem] placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'

function chip(on: boolean) {
  return `px-3 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
    on ? 'border-primary bg-primary-soft text-primary' : 'border-border text-muted hover:text-foreground'
  }`
}

export function Glossary() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<GlossaryCategory | 'all'>('all')

  const results = useMemo(() => {
    const kw = q.trim().toLowerCase()
    return GLOSSARY.filter((t) => {
      if (cat !== 'all' && t.category !== cat) return false
      if (kw) {
        const hay = (t.term + ' ' + (t.en ?? '') + ' ' + t.def).toLowerCase()
        if (!hay.includes(kw)) return false
      }
      return true
    })
  }, [q, cat])

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="용어 검색 (한글·영문·뜻)"
        aria-label="용어 검색"
        className={inputClass}
      />

      <div className="flex flex-wrap gap-2 mt-3 mb-4">
        <Pill on={cat === 'all'} onClick={() => setCat('all')}>
          전체
        </Pill>
        {GLOSSARY_CATEGORIES.map((c) => (
          <Pill key={c} on={cat === c} onClick={() => setCat(c)}>
            {c}
          </Pill>
        ))}
      </div>

      <p className="text-sm text-muted mb-3">
        <b className="text-foreground">{results.length}</b>개 용어
      </p>

      {results.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-10 text-center text-sm text-muted">
          검색 결과가 없습니다.
        </div>
      ) : (
        <ul className="space-y-2.5">
          {results.map((t) => (
            <li key={t.term} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h2 className="font-bold">{t.term}</h2>
                {t.en && <span className="text-xs text-subtle">{t.en}</span>}
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-surface-2 text-muted">{t.category}</span>
              </div>
              <p className="prose-read mt-1.5 text-[0.95rem] text-muted">{t.def}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={chip(on)}>
      {children}
    </button>
  )
}
