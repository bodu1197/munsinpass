import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { LoginForm } from './login-form'
import { isSupabaseConfigured } from '@/utils/supabase/config'
import { SupabaseNotice } from '@/app/auth/supabase-notice'
import { IconGraduationCap } from '@/components/icons'

export const metadata: Metadata = {
  title: '로그인 | 문신패스',
  description: '문신패스 계정으로 로그인하세요.',
}

export default function LoginPage() {
  const configured = isSupabaseConfigured()
  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold">
            <span className="grid place-items-center h-9 w-9 rounded-xl bg-primary text-on-primary">
              <IconGraduationCap size={22} />
            </span>
            문신패스
          </Link>
          <p className="mt-3 text-sm text-muted">학습을 이어가려면 로그인하세요</p>
        </div>

        {!configured && <SupabaseNotice />}

        {/* 폼 */}
        <Suspense fallback={<div className="h-64" />}>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center text-sm text-muted">
          계정이 없으신가요?{' '}
          <Link href="/auth/signup" className="text-primary font-medium hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </main>
  )
}
