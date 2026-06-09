import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { isSupabaseConfigured } from '@/utils/supabase/config'
import { NicknameForm, PasswordForm, DeleteAccountForm } from './settings-form'

export const metadata: Metadata = {
  title: '계정 설정 | 문신패스',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="py-10">
        <p className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
          Supabase가 설정되지 않아 계정 설정을 사용할 수 없습니다.
        </p>
      </div>
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/settings')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nickname')
    .eq('id', user.id)
    .single()
  const nickname = profile?.nickname ?? user.email?.split('@')[0] ?? ''

  return (
    <div className="py-6 max-w-xl">
      <h1 className="text-xl font-bold mb-1">계정 설정</h1>
      <p className="text-sm text-muted mb-6">프로필과 보안 설정을 관리합니다.</p>

      <div className="space-y-4">
        {/* 이메일(읽기 전용) */}
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-semibold mb-1">이메일</h2>
          <p className="text-sm text-muted">{user.email}</p>
        </section>

        {/* 닉네임 */}
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-semibold mb-3">닉네임</h2>
          <NicknameForm initial={nickname} />
        </section>

        {/* 비밀번호 */}
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-semibold mb-3">비밀번호 변경</h2>
          <PasswordForm />
        </section>

        {/* 회원 탈퇴 */}
        <section className="rounded-2xl border border-danger/40 bg-surface p-5">
          <h2 className="font-semibold mb-3 text-danger">회원 탈퇴</h2>
          <DeleteAccountForm />
        </section>
      </div>
    </div>
  )
}
