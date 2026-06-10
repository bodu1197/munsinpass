'use client'

import { useActionState } from 'react'
import { updateNickname, updatePassword, deleteAccount } from '@/app/actions/account'
import type { AuthState } from '@/app/actions/auth'
import { inputClass } from '@/components/ui'

const labelClass = 'block text-sm font-medium text-foreground mb-1.5'

function Alert({ state }: { state: AuthState }) {
  if (!state) return null
  if (state.error) {
    return (
      <p role="alert" aria-live="polite" className="rounded-xl bg-danger-soft border border-border px-4 py-2.5 text-sm text-danger">
        {state.error}
      </p>
    )
  }
  if (state.message) {
    return (
      <p role="status" aria-live="polite" className="rounded-xl bg-primary-soft border border-border px-4 py-2.5 text-sm text-primary">
        {state.message}
      </p>
    )
  }
  return null
}

export function NicknameForm({ initial }: { initial: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(updateNickname, null)
  return (
    <form action={action} className="space-y-3">
      <Alert state={state} />
      <div>
        <label htmlFor="nickname" className={labelClass}>닉네임</label>
        <input
          id="nickname"
          name="nickname"
          type="text"
          required
          maxLength={20}
          defaultValue={initial}
          placeholder="닉네임"
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="py-2.5 px-5 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-60 text-on-primary font-semibold text-sm transition-colors cursor-pointer disabled:cursor-default"
      >
        {pending ? '저장 중…' : '닉네임 저장'}
      </button>
    </form>
  )
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePassword, null)
  return (
    <form action={action} className="space-y-3">
      <Alert state={state} />
      <div>
        <label htmlFor="current" className={labelClass}>현재 비밀번호</label>
        <input id="current" name="current" type="password" required autoComplete="current-password" placeholder="현재 비밀번호" className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>새 비밀번호</label>
        <input id="password" name="password" type="password" required autoComplete="new-password" placeholder="8자 이상" className={inputClass} />
      </div>
      <div>
        <label htmlFor="confirm" className={labelClass}>새 비밀번호 확인</label>
        <input id="confirm" name="confirm" type="password" required autoComplete="new-password" placeholder="다시 입력" className={inputClass} />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="py-2.5 px-5 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-60 text-on-primary font-semibold text-sm transition-colors cursor-pointer disabled:cursor-default"
      >
        {pending ? '변경 중…' : '비밀번호 변경'}
      </button>
    </form>
  )
}

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(deleteAccount, null)
  return (
    <form action={action} className="space-y-3">
      <Alert state={state} />
      <p className="text-sm text-muted leading-relaxed">
        탈퇴하면 계정과 모든 학습 기록·진도가 <strong className="text-danger">영구 삭제</strong>되며 복구할 수 없습니다.
        계속하려면 아래에 <strong>탈퇴</strong>를 입력하세요.
      </p>
      <input
        name="confirm"
        type="text"
        required
        placeholder='"탈퇴" 입력'
        autoComplete="off"
        className={inputClass}
      />
      <button
        type="submit"
        disabled={pending}
        className="py-2.5 px-5 rounded-xl border border-danger text-danger hover:bg-danger-soft disabled:opacity-60 font-semibold text-sm transition-colors cursor-pointer disabled:cursor-default"
      >
        {pending ? '처리 중…' : '회원 탈퇴'}
      </button>
    </form>
  )
}
