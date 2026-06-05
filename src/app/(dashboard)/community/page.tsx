import type { Metadata } from 'next'
import { Community } from './community'
import { IconMessage } from '@/components/icons'

export const metadata: Metadata = {
  title: '커뮤니티 | 문신패스',
  description: '수험생들과 정보를 나누고 질문을 주고받으세요.',
}

export default function CommunityPage() {
  return (
    <div className="py-6">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="grid place-items-center h-9 w-9 rounded-xl bg-primary-soft text-primary">
          <IconMessage size={19} />
        </span>
        <h1 className="text-xl font-bold">커뮤니티</h1>
      </div>
      <p className="text-sm text-muted mb-6">시험 정보와 학습 팁을 나눠보세요.</p>
      <Community />
    </div>
  )
}
