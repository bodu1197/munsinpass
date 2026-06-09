import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Search } from './search'
import { IconSearch } from '@/components/icons'

export const metadata: Metadata = {
  title: '문제 검색 | 문신패스',
  description: '키워드·과목·난이도로 예상문제를 검색하세요.',
}

export default function SearchPage() {
  return (
    <div className="py-6">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="grid place-items-center h-9 w-9 rounded-xl bg-primary-soft text-primary">
          <IconSearch size={19} />
        </span>
        <h1 className="text-xl font-bold">문제 검색</h1>
      </div>
      <p className="text-sm text-muted mb-6">키워드·과목·난이도로 예상문제를 찾아보세요.</p>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-surface-2" />}>
        <Search />
      </Suspense>
    </div>
  )
}
