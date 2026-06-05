import type { Metadata } from 'next'
import Link from 'next/link'
import { SUBJECTS, getSubjectCount } from '@/data/questions'
import { IconChevronRight, SUBJECT_ICON } from '@/components/icons'

export const metadata: Metadata = {
  title: '시험 안내 | 문신패스',
  description: '문신사 국가시험 개요, 출제 과목, 주요 일정과 자주 묻는 질문을 확인하세요.',
}

const TIMELINE = [
  { date: '2025.10', label: '문신사법 공포', done: true },
  { date: '2026', label: '시험 준비 기간 · 세부 출제기준 마련', done: true },
  { date: '2027.10', label: '법 시행일 · 면허제도 본격 개시', done: false },
  { date: '2027 말', label: '첫 국가시험 시행 예정', done: false },
  { date: '~2029', label: '기존 종사자 임시 특례 기간(예상)', done: false },
]

const FAQ = [
  {
    q: '시험은 언제 시행되나요?',
    a: '문신사법이 2025년 10월 공포되어 2027년 10월 시행 예정입니다. 첫 국가시험은 2027년 말로 예상되며, 구체적 일정과 출제기준은 향후 확정·공고됩니다.',
  },
  {
    q: '어떤 과목이 출제되나요?',
    a: '위생·감염 관리, 법규·면허, 색소·염료·재료, 기초 해부·피부학 중심으로 구성될 것으로 예상됩니다. 본 앱은 이 4개 영역의 예상문제를 제공합니다.',
  },
  {
    q: '합격 기준은 어떻게 되나요?',
    a: '세부 기준은 확정 전이며, 본 앱의 모의고사는 학습 편의를 위해 60점 기준을 사용합니다. 실제 기준은 공고를 확인하세요.',
  },
  {
    q: '본 앱의 문제는 실제 기출문제인가요?',
    a: '아니요. 아직 기출문제가 존재하지 않으므로, 공개된 위생·안전·해부 지식을 바탕으로 만든 학습용 예상문제입니다. 실제 시험과 다를 수 있습니다.',
  },
]

export default function GuidePage() {
  return (
    <div className="py-6 space-y-8">
      <header>
        <h1 className="text-xl font-bold mb-1">시험 안내</h1>
        <p className="text-sm text-muted">문신사 국가시험 개요와 준비 정보를 정리했습니다.</p>
      </header>

      {/* 개요 */}
      <section className="rounded-2xl bg-primary text-on-primary p-6">
        <h2 className="font-bold mb-1.5">문신사 국가시험이란?</h2>
        <p className="prose-read text-[0.95rem] opacity-90">
          2025년 제정된 문신사법에 따라 도입되는 국가 면허 시험입니다. 일정 수준의 위생·안전
          역량을 검증해 공중위생을 보호하는 것을 목표로 하며, 2027년 시행을 앞두고 있습니다.
        </p>
      </section>

      {/* 출제 과목 */}
      <section>
        <h2 className="text-base font-bold mb-3">출제 과목</h2>
        <div className="rounded-2xl border border-border bg-surface overflow-hidden divide-y divide-border">
          {SUBJECTS.map((s) => {
            const Icon = SUBJECT_ICON[s.key]
            return (
              <Link
                key={s.key}
                href={`/study/${s.key}`}
                className="flex items-center gap-3.5 px-5 py-4 hover:bg-surface-2 transition-colors"
              >
                <span className="grid place-items-center h-10 w-10 shrink-0 rounded-xl bg-primary-soft text-primary">
                  <Icon size={20} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[0.95rem]">{s.label}</p>
                  <p className="text-sm text-muted truncate">{s.desc}</p>
                </div>
                <span className="tabular text-xs text-subtle shrink-0">{getSubjectCount(s.key)}문항</span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* 주요 일정 */}
      <section>
        <h2 className="text-base font-bold mb-3">주요 일정</h2>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <ol className="relative border-l border-border ml-2">
            {TIMELINE.map((item) => (
              <li key={item.date} className="ml-5 pb-5 last:pb-0">
                <span
                  className={`absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-surface ${
                    item.done ? 'bg-border-strong' : 'bg-primary'
                  }`}
                />
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
                  <span className="tabular text-xs text-subtle w-16 shrink-0">{item.date}</span>
                  <span className={`text-sm ${item.done ? 'text-subtle' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="text-base font-bold mb-3">자주 묻는 질문</h2>
        <div className="space-y-2">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-border bg-surface overflow-hidden"
            >
              <summary className="cursor-pointer list-none px-5 py-4 text-[0.95rem] font-medium flex items-center justify-between gap-3">
                {item.q}
                <IconChevronRight
                  size={18}
                  className="text-subtle shrink-0 transition-transform group-open:rotate-90"
                />
              </summary>
              <p className="prose-read px-5 pb-4 text-[0.95rem] text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <p className="text-xs text-subtle leading-relaxed border-t border-border pt-4">
        ※ 본 안내는 공개 정보를 바탕으로 한 학습 참고용이며, 정확한 일정·자격·기준은 보건복지부 및
        한국보건의료인국가시험원 등 공식 공고를 확인하세요.
      </p>
    </div>
  )
}
