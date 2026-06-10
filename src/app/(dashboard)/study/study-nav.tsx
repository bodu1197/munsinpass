'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { IconChevronLeft, IconHome } from '@/components/icons'

// 학습 영역 상단 고정 내비 — 이전 페이지/학습 홈으로 빠르게 복귀(매번 빠져나갔다 재진입하는 불편 해소).
// (dashboard) 콘텐츠 컨테이너의 좌우 패딩(px-4 sm:px-6)을 음수 마진으로 상쇄해 가로 전체 폭 + sticky(top-16=헤더 h-16 아래).
export function StudyNav() {
  const pathname = usePathname()
  const router = useRouter()
  const isHome = pathname === '/study'

  function goBack() {
    // 딥링크 진입(앱 내 히스토리 없음) 시 뒤로가기가 사이트를 벗어나지 않도록 학습 홈으로 폴백
    if (typeof window !== 'undefined' && window.history.length > 1) router.back()
    else router.push('/study')
  }

  return (
    <div className="sticky top-16 z-30 -mx-4 sm:-mx-6 mb-1 flex items-center justify-between gap-2 border-b border-border bg-background/85 px-4 sm:px-6 py-2 backdrop-blur-md">
      <button
        type="button"
        onClick={goBack}
        aria-label="이전 페이지로"
        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-foreground transition-colors cursor-pointer"
      >
        <IconChevronLeft size={17} />
        뒤로
      </button>
      <Link
        href={isHome ? '/dashboard' : '/study'}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-foreground transition-colors"
      >
        <IconHome size={15} />
        {isHome ? '대시보드' : '학습 홈'}
      </Link>
    </div>
  )
}
