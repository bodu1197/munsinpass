import type { Metadata } from 'next'
import { listMembers } from '@/lib/admin-data'
import { IconSearch } from '@/components/icons'
import { PageTitle, DegradedBanner } from '../admin-ui'
import { MembersTable } from './members-table'

export const metadata: Metadata = {
  title: '회원 관리 | 최고 관리자',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const sp = await searchParams
  const q = typeof sp.q === 'string' ? sp.q : ''
  const { rows, degraded } = await listMembers(q)

  return (
    <div>
      <PageTitle title="회원 관리" desc="회원 권한·이용권을 관리하고 탈퇴 처리합니다." />
      <DegradedBanner items={degraded ? ['회원 목록(0003 적용 필요)'] : []} />

      <form className="mb-4 relative max-w-sm">
        <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
        <input
          name="q"
          defaultValue={q}
          placeholder="이메일·닉네임 검색"
          aria-label="회원 검색"
          className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2 text-sm focus:border-primary outline-none"
        />
      </form>

      <p className="text-xs text-subtle mb-2">총 {rows.length}명{q && ` · "${q}" 검색`}</p>
      <MembersTable rows={rows} />
    </div>
  )
}
