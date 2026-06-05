import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SUBJECT_MAP, SUBJECTS, type SubjectKey } from '@/data/questions'
import { THEORY, type TheoryTable } from '@/data/theory'
import { IconArrowRight, IconCheck, IconChevronRight, SUBJECT_ICON } from '@/components/icons'

type Params = Promise<{ subject: string }>

export function generateStaticParams() {
  return SUBJECTS.map((s) => ({ subject: s.key }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { subject } = await params
  const meta = SUBJECT_MAP[subject as SubjectKey]
  if (!meta) return { title: '이론 정리 | 문신패스' }
  return {
    title: `${meta.label} 이론 정리 | 문신패스`,
    description: `${meta.label} 핵심 이론을 단원별로 정리한 교과서입니다.`,
  }
}

function chapterId(i: number) {
  return `ch-${i + 1}`
}

function Table({ table }: { table: TheoryTable }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-2 text-left">
            {table.columns.map((c) => (
              <th key={c} className="px-3 py-2.5 font-semibold whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {table.rows.map((row, ri) => (
            <tr key={ri} className="align-top">
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2.5 text-muted">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {table.caption && <p className="px-3 py-2 text-xs text-subtle">{table.caption}</p>}
    </div>
  )
}

export default async function TheoryPage({ params }: { params: Params }) {
  const { subject } = await params
  const meta = SUBJECT_MAP[subject as SubjectKey]
  if (!meta) notFound()

  const key = subject as SubjectKey
  const theory = THEORY[key]
  const Icon = SUBJECT_ICON[key]

  return (
    <div className="py-6">
      <div className="mb-4 flex items-center gap-1.5 text-sm text-muted">
        <Link href="/study" className="hover:text-primary transition-colors">
          과목별 학습
        </Link>
        <span className="text-subtle">/</span>
        <span className="text-foreground font-medium">{meta.label}</span>
        <span className="text-subtle">/</span>
        <span className="text-foreground font-medium">이론</span>
      </div>

      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-3">
        <span className="grid place-items-center h-11 w-11 rounded-xl bg-primary-soft text-primary">
          <Icon size={22} />
        </span>
        <div>
          <h1 className="text-xl font-bold">{meta.label} · 이론 정리</h1>
          <p className="text-sm text-muted">{theory.scope}</p>
        </div>
      </div>

      <p className="prose-read text-[0.95rem] text-muted rounded-2xl bg-surface-2 p-4">
        {theory.intro}
      </p>

      {/* 목차 */}
      <nav className="mt-5 rounded-2xl border border-border bg-surface p-4">
        <p className="text-xs font-semibold text-subtle mb-2">목차</p>
        <ol className="space-y-1">
          {theory.chapters.map((c, i) => (
            <li key={c.heading}>
              <a
                href={`#${chapterId(i)}`}
                className="flex items-center gap-2 py-1 text-[0.95rem] text-muted hover:text-primary transition-colors"
              >
                <span className="tabular text-xs text-subtle w-5 shrink-0">{i + 1}.</span>
                {c.heading}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* 본문 */}
      <div className="mt-6 space-y-5">
        {theory.chapters.map((c, i) => (
          <section
            key={c.heading}
            id={chapterId(i)}
            className="scroll-mt-20 rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] p-5 sm:p-6"
          >
            <h2 className="flex items-center gap-2.5 font-bold text-[1.1rem] mb-3">
              <span className="tabular grid place-items-center h-7 w-7 shrink-0 rounded-lg bg-primary text-on-primary text-sm">
                {i + 1}
              </span>
              {c.heading}
            </h2>

            <div className="prose-read space-y-3 text-[0.97rem] leading-[1.85]">
              {c.paragraphs.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
            </div>

            {c.table && <Table table={c.table} />}

            {c.keyPoints && c.keyPoints.length > 0 && (
              <div className="mt-4 rounded-xl bg-primary-soft p-4">
                <p className="text-xs font-bold text-primary mb-2">핵심 정리</p>
                <ul className="space-y-1.5">
                  {c.keyPoints.map((kp, j) => (
                    <li key={j} className="flex gap-2 text-[0.92rem]">
                      <IconCheck size={16} className="text-primary shrink-0 mt-0.5" />
                      <span>{kp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        ))}
      </div>

      <p className="text-xs text-subtle leading-relaxed border-t border-border pt-4 mt-6">
        ※ 본 교과서는 실제 출제기준 발표 전 단계에서 시험 범위를 폭넓게 포괄하도록 구성했습니다.
        {key === 'law' && ' 법규 내용은 공개 정보 기반의 일반 원칙이며, 세부 기준은 시행령·공식 공고로 확정됩니다.'}
      </p>

      {/* 문제 풀러 가기 */}
      <div className="mt-8 flex flex-col sm:flex-row gap-2.5">
        <Link
          href={`/study/${key}?mode=learn`}
          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-sm font-semibold transition-colors"
        >
          이 과목 문제 풀러 가기
          <IconArrowRight size={17} />
        </Link>
        <Link
          href="/study"
          className="inline-flex items-center justify-center gap-1.5 px-5 py-3.5 rounded-xl border border-border text-sm font-semibold hover:bg-surface-2 transition-colors"
        >
          과목 목록
          <IconChevronRight size={16} />
        </Link>
      </div>
    </div>
  )
}
