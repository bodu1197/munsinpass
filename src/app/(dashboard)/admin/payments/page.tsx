import type { Metadata } from 'next'
import { listPayments } from '@/lib/admin-data'
import { fmtDateTime } from '@/lib/format'
import { PageTitle, DegradedBanner, EmptyNote } from '../admin-ui'

export const metadata: Metadata = {
  title: '결제·이용권 | 최고 관리자',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  paid: { label: '완료', cls: 'bg-success-soft text-success' },
  pending: { label: '대기', cls: 'bg-warning-soft text-warning' },
  failed: { label: '실패', cls: 'bg-danger-soft text-danger' },
  cancelled: { label: '취소', cls: 'bg-surface-2 text-subtle' },
  refunded: { label: '환불', cls: 'bg-surface-2 text-subtle' },
}

export default async function PaymentsPage() {
  const { rows, revenue, degraded } = await listPayments()

  return (
    <div>
      <PageTitle title="결제·이용권" desc="결제 내역과 매출을 확인합니다." />
      <DegradedBanner items={degraded ? ['결제 내역(0004 적용 필요)'] : []} />

      <div className="grid grid-cols-2 gap-3 mb-5 max-w-md">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs text-muted">누적 매출(완료)</p>
          <p className="tabular text-2xl font-bold mt-1">
            {revenue.toLocaleString('ko-KR')}
            <span className="text-sm font-normal text-subtle ml-1">원</span>
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs text-muted">결제 건수</p>
          <p className="tabular text-2xl font-bold mt-1">
            {rows.length}
            <span className="text-sm font-normal text-subtle ml-1">건</span>
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyNote>결제 내역이 없습니다. (PortOne 결제 연동 후 표시됩니다)</EmptyNote>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((p) => {
            const s = STATUS_LABEL[p.status] ?? { label: p.status, cls: 'bg-surface-2 text-subtle' }
            return (
              <li key={p.id} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{p.email ?? p.userId}</p>
                    <p className="text-[11px] text-subtle truncate mt-0.5">
                      {p.provider} · {p.paymentId} · {fmtDateTime(p.createdAt)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="tabular font-bold text-sm">{p.amount.toLocaleString('ko-KR')}원</p>
                    <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${s.cls}`}>
                      {s.label}
                    </span>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
