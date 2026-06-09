'use client'

import Link from 'next/link'
import { useHydrated } from '@/lib/progress'
import { useOnboarded, setOnboarded } from '@/lib/onboarding'
import { IconArrowRight, IconX } from '@/components/icons'

export function WelcomeCard() {
  const hydrated = useHydrated()
  const onboarded = useOnboarded()
  if (!hydrated || onboarded) return null

  return (
    <div className="relative rounded-2xl bg-primary text-on-primary p-5">
      <button
        type="button"
        onClick={() => setOnboarded()}
        aria-label="환영 안내 닫기"
        className="absolute top-3 right-3 text-on-primary/70 hover:text-on-primary transition-colors cursor-pointer"
      >
        <IconX size={16} />
      </button>
      <p className="font-bold">문신패스에 오신 걸 환영합니다</p>
      <p className="text-sm opacity-90 mt-1">처음이시라면 1분 둘러보기로 학습 흐름을 익혀보세요.</p>
      <Link
        href="/onboarding"
        className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-xl bg-on-primary/15 hover:bg-on-primary/25 text-sm font-semibold transition-colors"
      >
        둘러보기
        <IconArrowRight size={15} />
      </Link>
    </div>
  )
}
