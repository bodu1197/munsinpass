import type { Metadata } from 'next'
import { Flashcards } from './flashcards'
import { IconCards } from '@/components/icons'

export const metadata: Metadata = {
  title: '플래시카드 | 문신패스',
  description: '문제를 카드로 빠르게 암기·복습하세요.',
}

export default function FlashcardsPage() {
  return (
    <div className="py-6">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="grid place-items-center h-9 w-9 rounded-xl bg-primary-soft text-primary">
          <IconCards size={19} />
        </span>
        <h1 className="text-xl font-bold">플래시카드</h1>
      </div>
      <p className="text-sm text-muted mb-6">카드를 넘기며 빠르게 암기·복습하세요. 카드를 누르면 정답·해설이 보입니다.</p>
      <Flashcards />
    </div>
  )
}
