import { logout } from '@/app/actions/auth'
import { createClient } from '@/utils/supabase/server'
import { isSupabaseConfigured } from '@/utils/supabase/config'
import Link from 'next/link'
import {
  IconBook,
  IconBookmark,
  IconGraduationCap,
  IconHome,
  IconLogout,
  IconSparkles,
  IconTimer,
} from '@/components/icons'
import { BottomNav, type NavItem } from './app-nav'
import { ProgressSync } from '@/components/progress-sync'
import { ThemeToggle } from '@/components/theme-toggle'

export default async function AppShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const configured = isSupabaseConfigured()
  let user: { email?: string } | null = null
  let nickname: string | null = null

  if (configured) {
    const supabase = await createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    user = authUser
    if (authUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('id', authUser.id)
        .single()
      nickname = profile?.nickname ?? authUser.email?.split('@')[0] ?? '수험생'
    }
  }

  // 모바일 하단 탭(아이콘, 5개)
  const bottomItems: NavItem[] = [
    { href: '/dashboard', label: '대시보드', icon: <IconHome size={20} /> },
    { href: '/study', label: '학습', icon: <IconBook size={20} /> },
    { href: '/mock-exam', label: '모의고사', icon: <IconTimer size={20} /> },
    { href: '/study/wrong-answers', label: '오답노트', icon: <IconSparkles size={20} /> },
    { href: '/study/bookmarks', label: '북마크', icon: <IconBookmark size={20} /> },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:rounded-xl focus:bg-primary focus:text-on-primary focus:text-sm focus:font-semibold"
      >
        본문 바로가기
      </a>
      <ProgressSync />
      {/* 헤더 (로고 + 사용자 — 메뉴는 홈 퀵메뉴로 이동) */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight shrink-0">
            <span className="grid place-items-center h-8 w-8 rounded-xl bg-primary text-on-primary">
              <IconGraduationCap size={18} />
            </span>
            문신패스
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />
            {user ? (
              <>
                <span className="text-sm text-muted hidden lg:block">{nickname}님</span>
                <Link
                  href="/settings"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  설정
                </Link>
                <form action={logout}>
                  <button
                    type="submit"
                    aria-label="로그아웃"
                    className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
                  >
                    <IconLogout size={16} />
                    <span className="hidden sm:inline">로그아웃</span>
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  로그인
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-sm font-semibold text-on-primary bg-primary hover:bg-primary-hover px-3.5 py-1.5 rounded-full transition-colors"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 본문 (사이드바 제거, 중앙 정렬 — 너비/좌우 여백의 단일 기준) */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6">
        <main id="main-content" className="pb-24 md:pb-12">{children}</main>
      </div>

      {/* 모바일 하단 탭 (데스크톱에선 숨김 — 상단 메뉴 사용) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/90 backdrop-blur-md md:hidden">
        <BottomNav items={bottomItems} />
      </nav>
    </div>
  )
}
