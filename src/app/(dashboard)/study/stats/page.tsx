import type { Metadata } from 'next'
import { Stats } from './stats'
import { IconChart } from '@/components/icons'

export const metadata: Metadata = {
  title: '학습 통계 | 문신패스',
  description: '과목·난이도별 정답률과 최근 추세를 확인하세요.',
}

export default function StatsPage() {
  return (
    <div className="py-6">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="grid place-items-center h-9 w-9 rounded-xl bg-primary-soft text-primary">
          <IconChart size={19} />
        </span>
        <h1 className="text-xl font-bold">학습 통계</h1>
      </div>
      <p className="text-sm text-muted mb-6">과목·난이도별 숙련도와 최근 정답률 추세입니다.</p>
      <Stats />
    </div>
  )
}
