import type { Metadata } from 'next'
import Link from 'next/link'
import { CURRICULUM } from '@/data/curriculum'
import { IconChevronRight, IconFileText } from '@/components/icons'

export const metadata: Metadata = {
  title: '교과서 | 문신패스',
  description:
    '반영구화장·문신 개론부터 안면해부학, 피부학, 공중보건, 소독·감염관리, 화장품·색채학까지 시험 범위를 폭넓게 정리한 교과서입니다.',
  alternates: { canonical: '/textbook' },
}

// 전체 커리큘럼 로드맵(작성 예정 포함)
const ROADMAP = [
  '반영구화장 및 문신 개론',
  '안면해부학',
  '피부학',
  '두피와 모발',
  '공중보건 위생학',
  '보건위생',
  '혈행성 감염(BBP)',
  '화장품학',
  '색채학',
  '고객상담',
  '반영구화장 및 문신의 실제',
]

export default function TextbookPage() {
  const availableTitles = new Set(CURRICULUM.map((p) => p.title))

  return (
    <div className="py-6">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="grid place-items-center h-9 w-9 rounded-xl bg-primary-soft text-primary">
          <IconFileText size={19} />
        </span>
        <h1 className="text-xl font-bold">교과서</h1>
      </div>
      <p className="text-sm text-muted mb-6">
        시험 범위를 폭넓게 포괄하는 통합 교과서입니다. PART별로 단원을 깊이 있게 정리했습니다.
      </p>

      {/* 공개된 PART */}
      <div className="space-y-3">
        {CURRICULUM.map((part) => (
          <Link
            key={part.id}
            href={`/textbook/${part.id}`}
            className="flex items-center gap-4 p-5 rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] hover:border-primary hover:shadow-[var(--shadow-pop)] transition-all"
          >
            <span className="tabular grid place-items-center h-11 w-11 shrink-0 rounded-xl bg-primary text-on-primary font-bold">
              {part.no}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">PART {part.no}. {part.title}</p>
              <p className="text-sm text-muted mt-0.5">{part.summary}</p>
              <p className="text-xs text-subtle mt-1">{part.chapters.length}개 단원</p>
            </div>
            <IconChevronRight size={20} className="text-subtle shrink-0" />
          </Link>
        ))}
      </div>

      {/* 작성 예정 로드맵 */}
      <div className="mt-8">
        <p className="text-xs font-semibold text-subtle mb-3">전체 커리큘럼 (순차 확장)</p>
        <ol className="rounded-2xl border border-border bg-surface overflow-hidden divide-y divide-border">
          {ROADMAP.map((title, i) => {
            const done = availableTitles.has(title)
            return (
              <li
                key={title}
                className="flex items-center gap-3 px-5 py-3 text-sm"
              >
                <span className="tabular text-xs text-subtle w-5 shrink-0">{i + 1}</span>
                <span className={done ? 'font-medium' : 'text-subtle'}>{title}</span>
                <span
                  className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                    done ? 'bg-primary-soft text-primary' : 'bg-surface-2 text-subtle'
                  }`}
                >
                  {done ? '공개' : '준비 중'}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
