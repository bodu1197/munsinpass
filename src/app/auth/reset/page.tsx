'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { isSupabaseConfigured } from '@/utils/supabase/config'

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground text-[0.95rem] placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!isSupabaseConfigured()) {
      setError('Supabase가 설정되지 않아 비밀번호 재설정을 사용할 수 없습니다.')
      return
    }
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.')
      return
    }
    if (password !== confirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    setPending(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setError('재설정에 실패했습니다. 링크가 만료되었을 수 있으니 다시 시도해주세요.')
        return
      }
      setDone(true)
    } catch {
      setError('재설정 중 오류가 발생했습니다.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-12">
      <h1 className="text-xl font-bold">새 비밀번호 설정</h1>
      <p className="text-sm text-muted mt-1 mb-6">메일 링크로 접속하셨다면 새 비밀번호를 입력하세요.</p>

      {done ? (
        <div className="space-y-4">
          <p role="status" className="rounded-xl bg-primary-soft border border-border px-4 py-2.5 text-sm text-primary">
            비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.
          </p>
          <Link href="/auth/login" className="block text-center py-3 rounded-xl bg-primary hover:bg-primary-hover text-on-primary font-semibold text-sm transition-colors">
            로그인하기
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <p role="alert" aria-live="polite" className="rounded-xl bg-danger-soft border border-border px-4 py-2.5 text-sm text-danger">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">새 비밀번호</label>
            <input id="password" type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8자 이상" className={inputClass} />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium mb-1.5">새 비밀번호 확인</label>
            <input id="confirm" type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="다시 입력" className={inputClass} />
          </div>
          <button type="submit" disabled={pending} className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-60 text-on-primary font-semibold text-sm transition-colors cursor-pointer">
            {pending ? '변경 중…' : '비밀번호 변경'}
          </button>
        </form>
      )}
    </div>
  )
}
