'use client'

import { useActionState, useState, useTransition } from 'react'
import { saveNotice, deleteNotice, type AdminResult } from '@/app/actions/admin'
import type { NoticeAdminRow } from '@/lib/admin-data'

const inputCls = 'w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:border-primary outline-none'

function NoticeForm({ notice, onDone }: { notice?: NoticeAdminRow; onDone?: () => void }) {
  const [state, action, pending] = useActionState<AdminResult | null, FormData>(
    async (_prev, fd) => {
      const r = await saveNotice(_prev, fd)
      if (r.ok) onDone?.()
      return r
    },
    null,
  )
  return (
    <form action={action} className="space-y-2">
      {notice && <input type="hidden" name="id" value={notice.id} />}
      <input
        name="title"
        defaultValue={notice?.title ?? ''}
        placeholder="제목"
        required
        aria-label="공지 제목"
        className={inputCls}
      />
      <textarea
        name="body"
        defaultValue={notice?.body ?? ''}
        placeholder="내용"
        rows={3}
        required
        aria-label="공지 내용"
        className={`${inputCls} resize-y`}
      />
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <label className="flex items-center gap-1.5">
          <input type="checkbox" name="pinned" defaultChecked={notice?.pinned ?? false} /> 상단 고정
        </label>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" name="published" defaultChecked={notice?.published ?? true} /> 게시
        </label>
        <button
          type="submit"
          disabled={pending}
          className="ml-auto rounded-full bg-primary text-on-primary px-4 py-1.5 text-xs font-semibold hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? '저장 중…' : '저장'}
        </button>
      </div>
      {state && !state.ok && (
        <p role="alert" className="rounded-xl border border-border bg-danger-soft px-3.5 py-2.5 text-xs text-danger">
          {state.error}
        </p>
      )}
    </form>
  )
}

export function NoticeEditor({ rows }: { rows: NoticeAdminRow[] }) {
  const [createKey, setCreateKey] = useState(0)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [pending, startTransition] = useTransition()
  const [delMsg, setDelMsg] = useState<string | null>(null)

  function remove(id: number) {
    if (!confirm('이 공지를 삭제할까요? 되돌릴 수 없습니다.')) return
    setDelMsg(null)
    startTransition(async () => {
      const r = await deleteNotice(id)
      if (!r.ok) setDelMsg(r.error ?? '삭제 실패')
    })
  }

  return (
    <div>
      <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-4 mb-5">
        <p className="text-sm font-semibold mb-2">새 공지 작성</p>
        <NoticeForm key={createKey} onDone={() => setCreateKey((k) => k + 1)} />
      </div>

      <p className="text-xs text-subtle mb-2">공지 {rows.length}건</p>
      {delMsg && (
        <p role="alert" className="mb-3 rounded-xl border border-border bg-danger-soft px-3.5 py-2.5 text-xs text-danger">
          {delMsg}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">등록된 공지가 없습니다.</p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((n) => (
            <li key={n.id} className={`rounded-2xl border border-border bg-surface p-4 ${pending ? 'opacity-80' : ''}`}>
              {editingId === n.id ? (
                <NoticeForm notice={n} onDone={() => setEditingId(null)} />
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">
                      {n.pinned && <span className="text-primary">[고정] </span>}
                      {n.title}
                      {!n.published && <span className="text-subtle font-normal"> (숨김)</span>}
                    </p>
                    <p className="text-xs text-muted mt-1 line-clamp-2">{n.body}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingId(n.id)}
                      className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted hover:bg-surface-2"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(n.id)}
                      disabled={pending}
                      className="rounded-lg px-2.5 py-1 text-xs text-danger hover:bg-danger-soft disabled:opacity-50"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
