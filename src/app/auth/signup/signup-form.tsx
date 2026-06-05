'use client'

import { useActionState } from 'react'
import { signup, type AuthState } from '@/app/actions/auth'

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground text-[0.95rem] placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'

const labelClass = 'block text-sm font-medium text-foreground mb-1.5'

export function SignupForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signup, null)

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p
          role="alert"
          aria-live="polite"
          className="rounded-xl bg-danger-soft border border-border px-4 py-2.5 text-sm text-danger"
        >
          {state.error}
        </p>
      )}

      {state?.message && (
        <p
          role="status"
          aria-live="polite"
          className="rounded-xl bg-success-soft border border-border px-4 py-2.5 text-sm text-success"
        >
          {state.message}
        </p>
      )}

      <div>
        <label htmlFor="nickname" className={labelClass}>
          닉네임
        </label>
        <input
          id="nickname"
          name="nickname"
          type="text"
          autoComplete="nickname"
          placeholder="사용할 닉네임 (선택)"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>
          이메일
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="example@email.com"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="password" className={labelClass}>
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="8자 이상 입력하세요"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-60 text-on-primary font-semibold text-sm transition-colors cursor-pointer disabled:cursor-default"
      >
        {pending ? '가입 처리 중…' : '회원가입'}
      </button>
    </form>
  )
}
