import type { Metadata } from 'next'
import { getAdminKpis } from '@/lib/admin-data'
import { PageTitle, DegradedBanner } from '../admin-ui'

export const metadata: Metadata = {
  title: '통계 | 최고 관리자',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

export default async function StatsPage() {
  const k = await getAdminKpis()
  const conversion = k.totalMembers > 0 ? Math.round((k.activeEntitlements / k.totalMembers) * 100) : 0

  const stats = [
    { label: '총 회원', value: `${k.totalMembers.toLocaleString('ko-KR')}명` },
    { label: '최근 7일 신규', value: `${k.newMembers7d.toLocaleString('ko-KR')}명` },
    { label: '활성 이용권', value: `${k.activeEntitlements.toLocaleString('ko-KR')}명` },
    { label: '결제 전환율', value: `${conversion}%`, hint: '활성 이용권 / 총 회원' },
    { label: '누적 문제풀이', value: `${k.totalAnswers.toLocaleString('ko-KR')}건` },
    { label: '뉴스 검토대기', value: `${k.newsPending.toLocaleString('ko-KR')}건` },
  ]

  return (
    <div>
      <PageTitle title="통계" desc="서비스 운영 지표 요약입니다." />
      <DegradedBanner items={k.degraded} />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] p-4">
            <p className="text-xs text-muted">{s.label}</p>
            <p className="tabular text-xl font-bold mt-1">{s.value}</p>
            {s.hint && <p className="text-[11px] text-subtle mt-0.5">{s.hint}</p>}
          </div>
        ))}
      </div>
      <p className="text-xs text-subtle mt-5 leading-relaxed">
        기간별 추이·과목별 정답률 등 상세 분석은 추후 추가 예정입니다.
      </p>
    </div>
  )
}
