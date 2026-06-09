'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setOnboarded } from '@/lib/onboarding'
import { IconArrowRight, IconBook, IconGraduationCap, IconSparkles } from '@/components/icons'

const STEPS = [
  {
    Icon: IconGraduationCap,
    title: '문신패스에 오신 걸 환영합니다',
    desc: '2027 문신사 국가시험을 한 곳에서 준비하세요. 교과서·과목별 문제·실전 모의고사·오답노트를 제공합니다.',
  },
  {
    Icon: IconBook,
    title: '이렇게 학습하세요',
    desc: '① 교과서로 개념을 잡고 → ② 과목별 문제로 연습 → ③ 실전 모의고사로 점검 → ④ 오답노트·복습으로 약점을 보완합니다.',
  },
  {
    Icon: IconSparkles,
    title: '약점은 복습으로 굳히기',
    desc: '틀린 문제는 오답노트에 모이고, 간격 반복(복습)으로 장기 기억이 됩니다. 검색·북마크·통계도 함께 활용하세요.',
  },
]

export function Onboarding() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const last = step === STEPS.length - 1
  const cur = STEPS[step]
  const Icon = cur.Icon

  function finish() {
    setOnboarded()
    router.push('/study')
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="rounded-3xl border border-border bg-surface shadow-[var(--shadow-pop)] p-8 text-center">
        <span className="inline-grid place-items-center h-16 w-16 rounded-2xl bg-primary-soft text-primary">
          <Icon size={32} />
        </span>
        <h1 className="mt-5 text-xl font-bold">{cur.title}</h1>
        <p className="mt-3 text-muted leading-relaxed">{cur.desc}</p>

        <div className="mt-6 flex items-center justify-center gap-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : 'w-2 bg-border'}`}
            />
          ))}
        </div>

        <div className="mt-7 flex gap-2.5">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-5 py-3 rounded-xl border border-border text-sm font-medium text-muted hover:bg-surface-2 transition-colors cursor-pointer"
            >
              이전
            </button>
          )}
          <button
            type="button"
            onClick={() => (last ? finish() : setStep(step + 1))}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-sm font-semibold transition-colors cursor-pointer"
          >
            {last ? '학습 시작하기' : '다음'}
            <IconArrowRight size={16} />
          </button>
        </div>

        <button
          type="button"
          onClick={finish}
          className="mt-4 text-xs text-subtle hover:text-foreground transition-colors cursor-pointer"
        >
          건너뛰기
        </button>
      </div>
    </div>
  )
}
