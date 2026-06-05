import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { isSupabaseConfigured } from '@/utils/supabase/config'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SUBJECTS } from '@/data/questions'
import { DashboardStats } from './dashboard-stats'
import { IconChevronRight, IconSparkles, IconTimer, SUBJECT_ICON } from '@/components/icons'

export const metadata: Metadata = {
  title: '대시보드 | 문신패스',
}

export default async function DashboardPage() {
  // Supabase 설정 시에만 로그인 강제. 미설정(데모) 시에는 게스트로 열람 허용.
  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login?next=/dashboard')
  }

  return (
    <div className="py-6 space-y-7">
      {/* D-Day + 오늘 학습 현황 (localStorage 기반, 클라이언트 렌더) */}
      <DashboardStats />

      {/* 빠른 시작 */}
      <section>
        <h2 className="text-base font-bold mb-3">빠른 시작</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/mock-exam"
            className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-surface hover:border-primary hover:shadow-[var(--shadow-pop)] transition-all"
          >
            <span className="grid place-items-center h-10 w-10 shrink-0 rounded-xl bg-primary-soft text-primary">
              <IconTimer size={20} />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-sm">실전 모의고사</p>
              <p className="text-xs text-muted mt-0.5">전 과목 · 타이머</p>
            </div>
          </Link>
          <Link
            href="/study/wrong-answers"
            className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-surface hover:border-primary hover:shadow-[var(--shadow-pop)] transition-all"
          >
            <span className="grid place-items-center h-10 w-10 shrink-0 rounded-xl bg-primary-soft text-primary">
              <IconSparkles size={20} />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-sm">AI 오답노트</p>
              <p className="text-xs text-muted mt-0.5">취약점 집중 공략</p>
            </div>
          </Link>
        </div>
      </section>

      {/* 과목별 학습 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold">과목별 학습</h2>
          <Link href="/study" className="text-xs text-primary font-medium hover:underline">
            전체 보기
          </Link>
        </div>
        <div className="rounded-2xl border border-border bg-surface overflow-hidden divide-y divide-border">
          {SUBJECTS.map((s) => {
            const Icon = SUBJECT_ICON[s.key]
            return (
              <Link
                key={s.key}
                href={`/study/${s.key}`}
                className="flex items-center gap-3.5 px-5 py-4 hover:bg-surface-2 transition-colors"
              >
                <span className="grid place-items-center h-10 w-10 shrink-0 rounded-xl bg-primary-soft text-primary">
                  <Icon size={20} />
                </span>
                <span className="font-medium text-[0.95rem]">{s.label}</span>
                <IconChevronRight size={18} className="ml-auto text-subtle" />
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
