import type { Metadata } from 'next'
import { Bookmarks } from './bookmarks'
import { IconBookmark } from '@/components/icons'

export const metadata: Metadata = {
  title: '북마크 | 문신패스',
  description: '북마크한 문제를 모아 복습하세요.',
}

export default function BookmarksPage() {
  return (
    <div className="py-6">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="grid place-items-center h-9 w-9 rounded-xl bg-primary-soft text-primary">
          <IconBookmark size={19} />
        </span>
        <h1 className="text-xl font-bold">북마크</h1>
      </div>
      <p className="text-sm text-muted mb-6">북마크한 문제를 모아 복습하세요.</p>
      <Bookmarks />
    </div>
  )
}
