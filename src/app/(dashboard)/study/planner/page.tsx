import type { Metadata } from 'next'
import { Planner } from './planner'
import { IconCalendar } from '@/components/icons'

export const metadata: Metadata = {
  title: '학습 플래너 | 문신패스',
  description: '일일 목표와 D-day, 최근 학습량으로 학습 계획을 관리하세요.',
}

export default function PlannerPage() {
  return (
    <div className="py-6">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="grid place-items-center h-9 w-9 rounded-xl bg-primary-soft text-primary">
          <IconCalendar size={19} />
        </span>
        <h1 className="text-xl font-bold">학습 플래너</h1>
      </div>
      <p className="text-sm text-muted mb-6">일일 목표와 D-day, 최근 7일 학습량을 한눈에 관리하세요.</p>
      <Planner />
    </div>
  )
}
