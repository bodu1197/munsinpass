import type { Metadata } from 'next'
import Link from 'next/link'
import { getAdminKpis } from '@/lib/admin-data'
import { PageTitle, DegradedBanner } from './admin-ui'
import {
  IconUsers,
  IconCreditCard,
  IconNewspaper,
  IconBell,
  IconChart,
  IconCheck,
  IconChevronRight,
} from '@/components/icons'

export const metadata: Metadata = {
  title: '최고 관리자 | 문신패스',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const k = await getAdminKpis()

  const cards = [
    { label: '총 회원', value: k.totalMembers, unit: '명', Icon: IconUsers },
    { label: '신규(7일)', value: k.newMembers7d, unit: '명', Icon: IconUsers },
    { label: '활성 이용권', value: k.activeEntitlements, unit: '명', Icon: IconCheck },
    { label: '뉴스 검토대기', value: k.newsPending, unit: '건', Icon: IconNewspaper },
    { label: '공지', value: k.noticeCount, unit: '건', Icon: IconBell },
    { label: '누적 풀이', value: k.totalAnswers, unit: '건', Icon: IconChart },
  ]

  const quick = [
    { href: '/admin/members', label: '회원 관리', desc: '권한·이용권·탈퇴', Icon: IconUsers },
    { href: '/admin/payments', label: '결제·이용권', desc: '결제 내역·매출', Icon: IconCreditCard },
    { href: '/admin/news', label: '뉴스 검토', desc: `검토대기 ${k.newsPending}건`, Icon: IconNewspaper },
    { href: '/admin/notices', label: '공지 관리', desc: '작성·수정·게시', Icon: IconBell },
  ]

  return (
    <div>
      <PageTitle title="최고 관리자" desc="사이트 운영 현황과 관리 기능을 한 곳에서." />
      <DegradedBanner items={k.degraded} />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cards.map(({ label, value, unit, Icon }) => (
          <div key={label} className="rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] p-4">
            <div className="flex items-center gap-2 text-muted">
              <Icon size={15} />
              <span className="text-xs">{label}</span>
            </div>
            <p className="tabular text-2xl font-bold mt-2">
              {value.toLocaleString('ko-KR')}
              <span className="text-sm font-normal text-subtle ml-1">{unit}</span>
            </p>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-bold mt-8 mb-3">바로가기</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {quick.map(({ href, label, desc, Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-surface hover:border-primary hover:shadow-[var(--shadow-pop)] transition-all"
          >
            <span className="grid place-items-center h-10 w-10 shrink-0 rounded-xl bg-primary-soft text-primary">
              <Icon size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-muted mt-0.5">{desc}</p>
            </div>
            <IconChevronRight size={18} className="text-subtle" />
          </Link>
        ))}
      </div>
    </div>
  )
}
