import type { Metadata } from 'next'
import { Review } from './review'
import { IconRefresh } from '@/components/icons'

export const metadata: Metadata = {
  title: '복습 | 문신패스',
  description: '간격 반복(스페이스드 리피티션)으로 약점 문제를 복습하세요.',
}

export default function ReviewPage() {
  return (
    <div className="py-6">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="grid place-items-center h-9 w-9 rounded-xl bg-primary-soft text-primary">
          <IconRefresh size={19} />
        </span>
        <h1 className="text-xl font-bold">복습</h1>
      </div>
      <p className="text-sm text-muted mb-6">풀었던 문제를 간격을 두고 다시 풀어 장기 기억으로 만듭니다.</p>
      <Review />
    </div>
  )
}
