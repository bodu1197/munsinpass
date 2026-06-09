'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  QUESTIONS,
  SUBJECTS,
  SUBJECT_MAP,
  SUBJECT_TO_PARTS,
  getDifficulty,
  type SubjectKey,
} from '@/data/questions'
import { BookmarkButton } from '@/components/bookmark-button'
import { SUBJECT_ICON } from '@/components/icons'

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground text-[0.95rem] placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'

const DIFF_LABEL: Record<number, string> = { 1: '하', 2: '중', 3: '상' }
const MAX_RESULTS = 100

function chip(on: boolean) {
  return `px-3 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
    on ? 'border-primary bg-primary-soft text-primary' : 'border-border text-muted hover:text-foreground'
  }`
}

// 교과서 PART id → 관련 과목(SUBJECT_TO_PARTS 역매핑)
function subjectsForPart(part: string): SubjectKey[] {
  return (Object.keys(SUBJECT_TO_PARTS) as SubjectKey[]).filter((s) =>
    SUBJECT_TO_PARTS[s].includes(part)
  )
}

export function Search() {
  const params = useSearchParams()
  const partParam = params.get('part') || ''
  const subjectParam = params.get('subject') || ''

  const initialSubjects = useMemo<SubjectKey[]>(() => {
    if (subjectParam && SUBJECTS.some((s) => s.key === subjectParam)) {
      return [subjectParam as SubjectKey]
    }
    if (partParam) return subjectsForPart(partParam)
    return []
  }, [subjectParam, partParam])

  const [keyword, setKeyword] = useState('')
  const [subjects, setSubjects] = useState<SubjectKey[]>(initialSubjects)
  const [diffs, setDiffs] = useState<number[]>([])

  const results = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return QUESTIONS.filter((q) => {
      if (subjects.length && !subjects.includes(q.subject)) return false
      if (diffs.length && !diffs.includes(getDifficulty(q.id))) return false
      if (kw) {
        const hay = (q.question + ' ' + q.choices.join(' ') + ' ' + q.explanation).toLowerCase()
        if (!hay.includes(kw)) return false
      }
      return true
    })
  }, [keyword, subjects, diffs])

  const toggleSubject = (k: SubjectKey) =>
    setSubjects((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]))
  const toggleDiff = (d: number) =>
    setDiffs((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]))

  return (
    <div>
      {partParam && initialSubjects.length > 0 && (
        <p className="text-xs text-subtle mb-3">교과서 단원과 연결된 과목으로 필터링했습니다.</p>
      )}

      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="키워드로 검색 (문제·보기·해설)"
        aria-label="문제 검색"
        className={inputClass}
      />

      <div className="flex flex-wrap gap-2 mt-3">
        {SUBJECTS.map((s) => (
          <button key={s.key} type="button" onClick={() => toggleSubject(s.key)} className={chip(subjects.includes(s.key))}>
            {s.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {[1, 2, 3].map((d) => (
          <button key={d} type="button" onClick={() => toggleDiff(d)} className={chip(diffs.includes(d))}>
            난이도 {DIFF_LABEL[d]}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted mt-4 mb-3">
        총 <b className="text-foreground">{results.length}</b>문항
      </p>

      {results.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-10 text-center text-sm text-muted">
          조건에 맞는 문항이 없습니다. 검색어나 필터를 바꿔보세요.
        </div>
      ) : (
        <ul className="space-y-2.5">
          {results.slice(0, MAX_RESULTS).map((q) => {
            const meta = SUBJECT_MAP[q.subject]
            const Icon = SUBJECT_ICON[q.subject]
            const d = getDifficulty(q.id)
            return (
              <li key={q.id} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-surface-2 text-muted">
                      <Icon size={13} />
                      {meta.label}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-muted">난이도 {DIFF_LABEL[d]}</span>
                  </div>
                  <BookmarkButton id={q.id} />
                </div>
                <p className="text-[0.95rem] font-medium leading-relaxed">{q.question}</p>
                <p className="mt-2 text-xs text-muted">
                  정답 {q.answer + 1}. {q.choices[q.answer]}
                </p>
                <p className="prose-read mt-2 text-[0.9rem] text-muted rounded-xl bg-surface-2 p-3">{q.explanation}</p>
              </li>
            )
          })}
        </ul>
      )}

      {results.length > MAX_RESULTS && (
        <p className="text-xs text-subtle mt-3 text-center">
          상위 {MAX_RESULTS}문항만 표시됩니다. 검색어·필터로 좁혀보세요.
        </p>
      )}
    </div>
  )
}
