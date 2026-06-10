'use client'

// 관리자 뉴스 검토 — 승인/반려 버튼. 단일 액션(intent) + useActionState 로
// 진행상태·에러를 한 곳에서 표시(조용한 실패 방지, 에러 혼동 없음).
import { useActionState } from 'react'
import { reviewNews } from '@/app/actions/news'

export function DraftActions({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState(reviewNews, null)

  return (
    <form action={action} className="mt-4">
      <input type="hidden" name="slug" value={slug} />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          name="intent"
          value="approve"
          disabled={pending}
          className="inline-flex items-center justify-center h-11 rounded-full bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait"
        >
          {pending ? '처리 중…' : '승인·게시'}
        </button>
        <button
          type="submit"
          name="intent"
          value="reject"
          disabled={pending}
          className="inline-flex items-center justify-center h-11 rounded-full border border-border px-4 text-sm font-medium text-muted hover:text-foreground transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait"
        >
          {pending ? '처리 중…' : '반려'}
        </button>
      </div>
      {state?.error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {state.error}
        </p>
      )}
    </form>
  )
}
