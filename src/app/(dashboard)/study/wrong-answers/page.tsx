import type { Metadata } from 'next'
import { WrongAnswers } from './wrong-answers'
import { IconSparkles } from '@/components/icons'

export const metadata: Metadata = {
  title: 'AI 오답노트 | 문신패스',
  description: '틀린 문제만 모아 다시 풀고 약점을 보완하세요.',
}

export default function WrongAnswersPage() {
  return (
    <div className="py-6">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="grid place-items-center h-9 w-9 rounded-xl bg-primary-soft text-primary">
          <IconSparkles size={19} />
        </span>
        <h1 className="text-xl font-bold">AI 오답노트</h1>
      </div>
      <p className="text-sm text-muted mb-6">
        가장 최근 풀이에서 틀린 문제를 모았습니다. 다시 풀어 약점을 줄여보세요.
      </p>
      <WrongAnswers />
    </div>
  )
}
