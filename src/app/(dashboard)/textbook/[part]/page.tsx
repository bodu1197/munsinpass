import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CURRICULUM, getPart } from '@/data/curriculum'
import type { TheoryTable } from '@/data/theory'
import { IconArrowRight, IconCheck, IconChevronRight } from '@/components/icons'

type Params = Promise<{ part: string }>

export function generateStaticParams() {
  return CURRICULUM.map((p) => ({ part: p.id }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { part } = await params
  const p = getPart(part)
  if (!p) return { title: '교과서 | 문신패스' }
  return {
    title: `PART ${p.no}. ${p.title} | 문신패스 교과서`,
    description: p.summary,
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

export default async function TextbookPartPage({ params }: { params: Params }) {
  const { part } = await params
  const p = getPart(part)
  if (!p) notFound()

  const idx = CURRICULUM.findIndex((c) => c.id === p.id)
  const next = CURRICULUM[idx + 1]

  return (
    <div className="py-6">
      <div className="mb-4 flex items-center gap-1.5 text-sm text-muted">
        <Link href="/textbook" className="hover:text-primary transition-colors">
          교과서
        </Link>
        <span className="text-subtle">/</span>
        <span className="text-foreground font-medium truncate">PART {p.no}. {p.title}</span>
      </div>

      <h1 className="text-xl font-bold">
        <span className="text-primary">PART {p.no}.</span> {p.title}
      </h1>
      <p className="text-sm text-muted mt-1">{p.summary}</p>

      {/* 목차 */}
      <nav className="mt-5 rounded-2xl border border-border bg-surface p-4">
        <p className="text-xs font-semibold text-subtle mb-2">목차</p>
        <ol className="space-y-1">
          {p.chapters.map((c, i) => (
            <li key={c.heading}>
              <a
                href={`#${chapterId(i)}`}
                className="flex items-center gap-2 py-1 text-[0.95rem] text-muted hover:text-primary transition-colors"
              >
                <span className="tabular text-xs text-subtle w-6 shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {c.heading}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* 본문 */}
      <div className="mt-6 space-y-5">
        {p.chapters.map((c, i) => (
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
              {c.paragraphs.map((para, j) => (
                <p key={j}>{para}</p>
              ))}
            </div>

            {c.table && <Table table={c.table} />}

            {c.sections?.map((s, si) => (
              <div key={si} className="mt-6">
                <h3 className="font-semibold text-[1.02rem] text-primary mb-2 pb-1 border-b border-border">
                  {s.title}
                </h3>
                <div className="prose-read space-y-3 text-[0.97rem] leading-[1.85]">
                  {s.paragraphs.map((para, k) => (
                    <p key={k}>{para}</p>
                  ))}
                </div>
                {s.table && <Table table={s.table} />}
              </div>
            ))}

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

      {/* 하단 이동 */}
      <div className="mt-8 flex flex-col sm:flex-row gap-2.5">
        {next ? (
          <Link
            href={`/textbook/${next.id}`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-sm font-semibold transition-colors"
          >
            다음: PART {next.no}. {next.title}
            <IconArrowRight size={17} />
          </Link>
        ) : (
          <Link
            href="/textbook"
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-sm font-semibold transition-colors"
          >
            교과서 목차로
          </Link>
        )}
        <Link
          href="/textbook"
          className="inline-flex items-center justify-center gap-1.5 px-5 py-3.5 rounded-xl border border-border text-sm font-semibold hover:bg-surface-2 transition-colors"
        >
          전체 목차
          <IconChevronRight size={16} />
        </Link>
      </div>
    </div>
  )
}
