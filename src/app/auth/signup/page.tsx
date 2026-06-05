import type { Metadata } from 'next'
import Link from 'next/link'
import { SignupForm } from './signup-form'
import { isSupabaseConfigured } from '@/utils/supabase/config'
import { SupabaseNotice } from '@/app/auth/supabase-notice'
import { IconGraduationCap } from '@/components/icons'

export const metadata: Metadata = {
  title: '회원가입 | 문신패스',
  description: '문신패스에 가입하고 국가시험을 준비하세요.',
}

export default function SignupPage() {
  const configured = isSupabaseConfigured()
  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold">
            <span className="grid place-items-center h-9 w-9 rounded-xl bg-primary text-on-primary">
              <IconGraduationCap size={22} />
            </span>
            문신패스
          </Link>
          <p className="mt-3 text-sm text-muted">가입하고 학습을 시작하세요</p>
        </div>

        {!configured && <SupabaseNotice />}

        <SignupForm />

        <p className="mt-6 text-center text-sm text-muted">
          이미 계정이 있으신가요?{' '}
          <Link href="/auth/login" className="text-primary font-medium hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </main>
  )
}
