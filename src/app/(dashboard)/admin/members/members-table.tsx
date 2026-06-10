'use client'

import { useState, useTransition } from 'react'
import {
  setUserRole,
  grantEntitlement,
  revokeEntitlement,
  deleteMember,
  type AdminResult,
} from '@/app/actions/admin'
import type { MemberRow } from '@/lib/admin-data'
import { fmtDate } from '@/lib/format'

export function MembersTable({ rows }: { rows: MemberRow[] }) {
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  function run(id: string, fn: () => Promise<AdminResult>) {
    setMsg(null)
    setBusyId(id)
    startTransition(async () => {
      const r = await fn()
      if (!r.ok) setMsg(r.error ?? '오류가 발생했습니다.')
      setBusyId(null)
    })
  }

  if (!rows.length) {
    return <p className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">회원이 없습니다.</p>
  }

  return (
    <div>
      {msg && (
        <p role="alert" className="mb-3 rounded-xl border border-border bg-danger-soft px-3.5 py-2.5 text-xs text-danger">
          {msg}
        </p>
      )}
      <ul className="space-y-2.5">
        {rows.map((m) => {
          const active = m.entitlementStatus === 'active'
          const rowBusy = pending && busyId === m.id
          return (
            <li
              key={m.id}
              className={`rounded-2xl border border-border bg-surface p-4 ${rowBusy ? 'opacity-60' : ''}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{m.nickname ?? '(닉네임 없음)'}</p>
                  <p className="text-xs text-muted truncate">{m.email ?? m.id}</p>
                  <p className="text-[11px] text-subtle mt-0.5">가입 {fmtDate(m.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${
                      active ? 'bg-success-soft text-success' : 'bg-surface-2 text-muted'
                    }`}
                  >
                    {active ? '이용권 활성' : '이용권 없음'}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="text-xs text-subtle">권한</label>
                <select
                  defaultValue={m.role}
                  disabled={rowBusy}
                  onChange={(e) => {
                    const next = e.target.value
                    if (next === m.role) return
                    if (confirm(`권한을 "${next}"(으)로 변경할까요?`)) {
                      run(m.id, () => setUserRole(m.id, next))
                    } else {
                      e.target.value = m.role // 취소 시 원래 값으로 복원
                    }
                  }}
                  className="rounded-lg border border-border bg-surface px-2 py-1 text-xs"
                  aria-label="권한 변경"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                  <option value="superadmin">superadmin</option>
                </select>

                {active ? (
                  <button
                    type="button"
                    disabled={rowBusy}
                    onClick={() => run(m.id, () => revokeEntitlement(m.id))}
                    className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted hover:bg-surface-2 disabled:opacity-50"
                  >
                    이용권 회수
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={rowBusy}
                    onClick={() => run(m.id, () => grantEntitlement(m.id))}
                    className="rounded-lg border border-primary text-primary px-2.5 py-1 text-xs font-medium hover:bg-primary-soft disabled:opacity-50"
                  >
                    이용권 부여
                  </button>
                )}

                <button
                  type="button"
                  disabled={rowBusy}
                  onClick={() => {
                    if (confirm(`정말 ${m.email ?? '이 회원'}을(를) 탈퇴 처리할까요? 되돌릴 수 없습니다.`)) {
                      run(m.id, () => deleteMember(m.id))
                    }
                  }}
                  className="ml-auto rounded-lg px-2.5 py-1 text-xs text-danger hover:bg-danger-soft disabled:opacity-50"
                >
                  탈퇴
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
