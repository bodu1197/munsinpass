import type { Metadata } from 'next'
import { Glossary } from './glossary'
import { IconBook } from '@/components/icons'

export const metadata: Metadata = {
  title: '용어사전 | 문신패스',
  description: '문신사 국가시험 핵심 용어를 검색·정리했습니다.',
}

export default function GlossaryPage() {
  return (
    <div className="py-6">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="grid place-items-center h-9 w-9 rounded-xl bg-primary-soft text-primary">
          <IconBook size={19} />
        </span>
        <h1 className="text-xl font-bold">용어사전</h1>
      </div>
      <p className="text-sm text-muted mb-6">시험 핵심 용어를 검색해 정리했습니다. 교과서 내용을 기반으로 작성했습니다.</p>
      <Glossary />
    </div>
  )
}
