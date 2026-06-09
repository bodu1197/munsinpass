'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { requestPasswordReset, type AuthState } from '@/app/actions/auth'

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground text-[0.95rem] placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(requestPasswordReset, null)

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-12">
      <h1 className="text-xl font-bold">비밀번호 재설정</h1>
      <p className="text-sm text-muted mt-1 mb-6">
        가입한 이메일을 입력하면 재설정 링크를 보내드립니다.
      </p>

      {state?.message && (
        <p role="status" aria-live="polite" className="mb-4 rounded-xl bg-primary-soft border border-border px-4 py-2.5 text-sm text-primary">
          {state.message}
        </p>
      )}
      {state?.error && (
        <p role="alert" aria-live="polite" className="mb-4 rounded-xl bg-danger-soft border border-border px-4 py-2.5 text-sm text-danger">
          {state.error}
        </p>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5">이메일</label>
          <input id="email" name="email" type="email" required autoComplete="email" placeholder="example@email.com" className={inputClass} />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-60 text-on-primary font-semibold text-sm transition-colors cursor-pointer"
        >
          {pending ? '전송 중…' : '재설정 링크 보내기'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        <Link href="/auth/login" className="text-primary hover:underline">로그인으로 돌아가기</Link>
      </p>
    </div>
  )
}
