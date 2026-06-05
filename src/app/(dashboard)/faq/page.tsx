import type { Metadata } from 'next'
import { FAQ_ALL, FAQ_GROUPS } from '@/data/faq'
import { IconHelp } from '@/components/icons'

export const metadata: Metadata = {
  title: '자주 묻는 질문 | 문신패스',
  description:
    '문신사법·국가시험 일정과 면허 취득, 그리고 문신패스 사용법에 대한 자주 묻는 질문과 답변을 정리했습니다.',
  alternates: { canonical: '/faq' },
}

// Google 리치 결과용 schema.org FAQPage 구조화 데이터
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ALL.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
}

export default function FaqPage() {
  return (
    <div className="py-6">
      {/* 구조화 데이터(JSON-LD) — 구글이 FAQ로 인식 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="flex items-center gap-2.5 mb-1">
        <span className="grid place-items-center h-9 w-9 rounded-xl bg-primary-soft text-primary">
          <IconHelp size={19} />
        </span>
        <h1 className="text-xl font-bold">자주 묻는 질문</h1>
      </div>
      <p className="text-sm text-muted mb-6">
        문신사법·국가시험과 문신패스 사용법에 대한 질문을 모았습니다.
      </p>

      <div className="space-y-8">
        {FAQ_GROUPS.map((group) => (
          <section key={group.category}>
            <h2 className="text-base font-bold mb-3">{group.category}</h2>
            <div className="space-y-2">
              {group.items.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-2xl border border-border bg-surface overflow-hidden"
                >
                  <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-3">
                    <h3 className="text-[0.95rem] font-medium">{item.q}</h3>
                    <span className="text-subtle shrink-0 transition-transform group-open:rotate-45 text-xl leading-none">
                      +
                    </span>
                  </summary>
                  <p className="prose-read px-5 pb-4 text-[0.95rem] text-muted">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="text-xs text-subtle leading-relaxed border-t border-border pt-4 mt-8">
        ※ 법령·일정·합격 기준 등은 변동될 수 있습니다. 정확한 내용은 보건복지부·한국보건의료인국가시험원 공식 공고를 확인하세요.
      </p>
    </div>
  )
}
