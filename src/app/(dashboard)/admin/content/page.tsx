import type { Metadata } from 'next'
import Link from 'next/link'
import { FAQ_GROUPS, FAQ_ALL } from '@/data/faq'
import { QUESTIONS, SUBJECTS, getSubjectCount } from '@/data/questions'
import { PageTitle } from '../admin-ui'

export const metadata: Metadata = {
  title: '콘텐츠 | 최고 관리자',
  robots: { index: false, follow: false },
}

export default function ContentOverviewPage() {
  return (
    <div>
      <PageTitle title="콘텐츠" desc="FAQ·문제은행 현황. 공지는 DB로 직접 관리합니다." />

      <div className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-xs text-subtle leading-relaxed mb-5">
        공지는{' '}
        <Link href="/admin/notices" className="text-primary hover:underline">
          공지 관리
        </Link>
        에서 작성·수정할 수 있습니다. FAQ·문제은행은 현재 코드(<span className="tabular">src/data</span>)로 관리되어 수정 시
        배포가 필요하며, DB 기반 편집(CMS)으로의 전환은 다음 단계 예정입니다.
      </div>

      <section className="mb-6">
        <h2 className="text-sm font-bold mb-2">FAQ · 총 {FAQ_ALL.length}건</h2>
        <ul className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
          {FAQ_GROUPS.map((g) => (
            <li key={g.category} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>{g.category}</span>
              <span className="tabular text-subtle text-xs">{g.items.length}건</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-bold mb-2">문제은행 · 총 {QUESTIONS.length}문항</h2>
        <ul className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
          {SUBJECTS.map((s) => (
            <li key={s.key} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>{s.label}</span>
              <span className="tabular text-subtle text-xs">{getSubjectCount(s.key)}문항</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
