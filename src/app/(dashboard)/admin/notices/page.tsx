import type { Metadata } from 'next'
import { listNoticesAdmin } from '@/lib/admin-data'
import { PageTitle, DegradedBanner } from '../admin-ui'
import { NoticeEditor } from './notice-editor'

export const metadata: Metadata = {
  title: '공지 관리 | 최고 관리자',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

export default async function AdminNoticesPage() {
  const { rows, degraded } = await listNoticesAdmin()
  return (
    <div>
      <PageTitle title="공지 관리" desc="공지사항을 작성·수정·게시합니다. 게시된 공지는 /notice 에 노출됩니다." />
      <DegradedBanner items={degraded ? ['공지(0005 적용 필요)'] : []} />
      <NoticeEditor rows={rows} />
    </div>
  )
}
