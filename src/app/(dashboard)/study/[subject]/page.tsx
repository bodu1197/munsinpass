import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  SUBJECT_MAP,
  SUBJECTS,
  getQuestionsBySubject,
  type SubjectKey,
} from '@/data/questions'
import { Quiz } from './quiz'
import { IconFileText } from '@/components/icons'

type Params = Promise<{ subject: string }>
type Search = Promise<{ mode?: string }>

export function generateStaticParams() {
  return SUBJECTS.map((s) => ({ subject: s.key }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { subject } = await params
  const meta = SUBJECT_MAP[subject as SubjectKey]
  if (!meta) return { title: '학습 | 문신패스' }
  return {
    title: `${meta.label} 문제풀이 | 문신패스`,
    description: meta.desc,
  }
}

export default async function SubjectQuizPage({
  params,
  searchParams,
}: {
  params: Params
  searchParams: Search
}) {
  const { subject } = await params
  const { mode } = await searchParams

  const meta = SUBJECT_MAP[subject as SubjectKey]
  if (!meta) notFound()

  const questions = getQuestionsBySubject(subject as SubjectKey)
  const quizMode = mode === 'test' ? 'test' : 'learn'

  return (
    <div className="py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-sm text-muted min-w-0">
          <Link href="/study" className="hover:text-primary transition-colors">
            과목별 학습
          </Link>
          <span className="text-subtle">/</span>
          <span className="text-foreground font-medium truncate">{meta.label}</span>
        </div>
        <Link
          href={`/study/${subject}/theory`}
          className="inline-flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
        >
          <IconFileText size={14} />
          이론 정리
        </Link>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center text-muted">
          아직 등록된 문제가 없습니다. 곧 추가될 예정입니다.
        </div>
      ) : (
        <Quiz subject={meta} questions={questions} initialMode={quizMode} />
      )}
    </div>
  )
}
