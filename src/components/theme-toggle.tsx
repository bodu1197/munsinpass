'use client'

import { useSyncExternalStore } from 'react'
import { IconMoon, IconSun } from '@/components/icons'

// 다크/라이트 전환 버튼. 실제 적용은 html.dark 클래스 토글 + localStorage 저장.
// 초기 .dark 설정은 layout.tsx 의 무플래시 스크립트가 페인트 전에 처리한다.
// progress.ts/bookmarks.ts 와 동일하게 useSyncExternalStore 로 하이드레이션 안전 + setState-in-effect 회피.

const THEME_EVENT = 'munshinpass:theme-change'

function subscribe(cb: () => void) {
  window.addEventListener(THEME_EVENT, cb)
  window.addEventListener('storage', cb) // 다른 탭에서 변경 시 반영
  return () => {
    window.removeEventListener(THEME_EVENT, cb)
    window.removeEventListener('storage', cb)
  }
}

// 클라이언트: 현재 .dark 여부. 서버/하이드레이션: false 고정 → 불일치 없음(마운트 후 실제값으로 재조정).
function isDark() {
  return document.documentElement.classList.contains('dark')
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, isDark, () => false)

  function toggle() {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {
      /* localStorage 불가(프라이빗 모드 등) — 토글은 동작, 저장만 생략 */
    }
    window.dispatchEvent(new Event(THEME_EVENT)) // 구독자(이 버튼) 즉시 갱신
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      title="테마 전환"
      className="grid place-items-center h-11 w-11 rounded-full text-muted hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer"
    >
      {dark ? <IconSun size={18} /> : <IconMoon size={18} />}
    </button>
  )
}
