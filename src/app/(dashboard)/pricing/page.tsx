import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { isSupabaseConfigured } from '@/utils/supabase/config'
import { IconCheck, IconArrowRight } from '@/components/icons'
import { PRICE_KRW } from '@/lib/billing'

export const metadata: Metadata = {
  title: '이용권 | 문신패스',
  description: '문신패스 학습 플랫폼 이용권 — 일회성 결제로 합격할 때까지 이용하세요.',
  openGraph: {
    title: '문신패스 이용권 — 합격할 때까지',
    description: '한 번 결제로 합격할 때까지 모든 학습 기능을 이용하세요.',
    type: 'website',
  },
}

export const dynamic = 'force-dynamic'

const INCLUDED = [
  '과목별 문제풀이 (위생·법규·색소·해부 전 과목)',
  '실전 모의고사 (제한 시간·자동 채점·과목별 분석)',
  'AI 오답노트 (틀린 문제 자동 수집·반복)',
  '플래시카드 · 학습 플래너 · 용어사전',
  '실기 체크리스트 (위생 순서·기구 세팅)',
  '학습 통계 · 대시보드 (기기 간 동기화)',
]

export default async function PricingPage() {
  let loggedIn = false
  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    loggedIn = !!user
  }

  return (
    <div className="py-10 max-w-2xl mx-auto">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm font-medium text-muted">
          <span className="h-2 w-2 rounded-full bg-success" />
          2027 문신사 국가시험 대비
        </span>
        <h1 className="mt-5 text-3xl sm:text-4xl font-bold">합격할 때까지, 하나의 이용권</h1>
        <p className="mt-4 text-muted leading-relaxed">
          한 번 결제하면 합격할 때까지 모든 학습 기능을 제한 없이 이용합니다.
        </p>
      </div>

      {/* 가격 카드 */}
      <div className="mt-8 rounded-3xl border border-border bg-surface shadow-[var(--shadow-pop)] p-7 sm:p-9">
        <div className="flex items-baseline gap-2">
          <span className="tabular text-4xl sm:text-5xl font-bold text-primary">
            {PRICE_KRW.toLocaleString('ko-KR')}원
          </span>
          <span className="text-muted">/ 일회성</span>
        </div>
        <p className="mt-2 text-sm text-subtle">합격할 때까지 이용 · 자동 결제 없음</p>

        <ul className="mt-6 space-y-3">
          {INCLUDED.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-0.5 grid place-items-center h-5 w-5 shrink-0 rounded-full bg-success text-on-primary">
                <IconCheck size={13} />
              </span>
              <span className="text-[0.95rem]">{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          {loggedIn ? (
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-surface-2 px-7 py-3.5 text-base font-semibold text-muted cursor-not-allowed"
            >
              결제 기능 준비 중
            </button>
          ) : (
            <Link
              href="/auth/signup?next=/pricing"
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-on-primary hover:bg-primary-hover transition-colors"
            >
              회원가입하고 시작하기
              <IconArrowRight size={18} />
            </Link>
          )}
        </div>
        {loggedIn && (
          <p className="mt-3 text-center text-xs text-subtle">
            안전한 결제(PortOne) 연동을 준비 중입니다. 곧 오픈됩니다.
          </p>
        )}
      </div>

      {/* 안내 */}
      <div className="mt-6 rounded-2xl border border-border bg-surface-2 p-5 text-xs text-subtle leading-relaxed">
        <p>
          · <strong className="text-muted">이용 기간</strong>: 결제일부터 합격할 때까지 이용하실 수 있으며,
          합격하시면 마이페이지에서 직접 종료(자가신고)하실 수 있습니다.
        </p>
        <p className="mt-1.5">
          · <strong className="text-muted">환불</strong>은{' '}
          <Link href="/legal/terms" className="text-primary hover:underline">
            이용약관
          </Link>
          의 환불 정책을 따릅니다. 디지털 학습 콘텐츠 특성상 이용 시작 후에는 일부 제한될 수 있습니다.
        </p>
        <p className="mt-1.5">· 공지·뉴스·시험안내·자주 묻는 질문은 결제 없이 열람할 수 있습니다.</p>
      </div>
    </div>
  )
}
