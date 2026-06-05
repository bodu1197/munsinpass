'use client'

import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { login, type AuthState } from '@/app/actions/auth'

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground text-[0.95rem] placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'

const labelClass = 'block text-sm font-medium text-foreground mb-1.5'

export function LoginForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(login, null)
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? ''
  const confirmError = searchParams.get('error') === 'confirm'

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}

      {confirmError && (
        <p
          role="alert"
          className="rounded-xl bg-warning-soft border border-border px-4 py-2.5 text-sm text-warning"
        >
          이메일 확인 링크가 만료되었거나 잘못되었습니다. 다시 시도해주세요.
        </p>
      )}

      {state?.error && (
        <p
          role="alert"
          aria-live="polite"
          className="rounded-xl bg-danger-soft border border-border px-4 py-2.5 text-sm text-danger"
        >
          {state.error}
        </p>
      )}

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
          autoComplete="current-password"
          placeholder="비밀번호를 입력하세요"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-60 text-on-primary font-semibold text-sm transition-colors cursor-pointer disabled:cursor-default"
      >
        {pending ? '로그인 중…' : '로그인'}
      </button>
    </form>
  )
}
