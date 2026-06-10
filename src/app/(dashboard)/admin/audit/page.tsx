import type { Metadata } from 'next'
import { listAudit } from '@/lib/admin-data'
import { fmtDateTimeShort } from '@/lib/format'
import { PageTitle, DegradedBanner, EmptyNote } from '../admin-ui'

export const metadata: Metadata = {
  title: '감사 로그 | 최고 관리자',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

export default async function AuditPage() {
  const { rows, degraded } = await listAudit(150)
  return (
    <div>
      <PageTitle title="감사 로그" desc="관리자 변경 작업 이력입니다." />
      <DegradedBanner items={degraded ? ['감사 로그(0003 적용 필요)'] : []} />
      {rows.length === 0 ? (
        <EmptyNote>기록된 관리자 작업이 없습니다.</EmptyNote>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-border bg-surface px-4 py-2.5 text-xs flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <span className="font-semibold text-foreground">{r.action}</span>
                {r.targetType && (
                  <span className="text-subtle">
                    {' · '}
                    {r.targetType}
                    {r.targetId ? `/${r.targetId.slice(0, 12)}` : ''}
                  </span>
                )}
                <span className="text-muted"> · {r.actorEmail ?? '—'}</span>
              </div>
              <span className="tabular text-subtle shrink-0">{fmtDateTimeShort(r.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
