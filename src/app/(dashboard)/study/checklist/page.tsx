import type { Metadata } from 'next'
import { ChecklistBoard } from './checklist-board'
import { IconChecklist } from '@/components/icons'

export const metadata: Metadata = {
  title: '실기 체크리스트 | 문신패스',
  description: '위생 순서·기구 세팅을 단계별로 점검하고 암기하세요.',
}

export default function ChecklistPage() {
  return (
    <div className="py-6">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="grid place-items-center h-9 w-9 rounded-xl bg-primary-soft text-primary">
          <IconChecklist size={19} />
        </span>
        <h1 className="text-xl font-bold">실기 체크리스트</h1>
      </div>
      <p className="text-sm text-muted mb-6">
        위생 순서와 기구 세팅을 단계별로 점검하세요. 항목을 눌러 체크할 수 있습니다.
      </p>
      <ChecklistBoard />
    </div>
  )
}
