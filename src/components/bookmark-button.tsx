'use client'

import { useIsBookmarked, toggleBookmark } from '@/lib/bookmarks'
import { IconBookmark } from '@/components/icons'

/** 문제 북마크 토글 버튼 (퀴즈·검색 등에서 공용) */
export function BookmarkButton({ id, size = 17 }: { id: string; size?: number }) {
  const on = useIsBookmarked(id)
  return (
    <button
      type="button"
      onClick={() => toggleBookmark(id)}
      aria-label={on ? '북마크 해제' : '북마크 추가'}
      aria-pressed={on}
      className={`shrink-0 grid place-items-center h-9 w-9 rounded-xl border transition-colors cursor-pointer ${
        on
          ? 'border-primary bg-primary-soft text-primary'
          : 'border-border text-subtle hover:text-foreground'
      }`}
    >
      <IconBookmark size={size} fill={on ? 'currentColor' : 'none'} />
    </button>
  )
}
