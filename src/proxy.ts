import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from '@/utils/supabase/config'
import type { Database } from '@/utils/supabase/types'
import { isUserAdmin } from '@/lib/admin-access'

// Next.js 16: `middleware` 컨벤션은 `proxy`로 변경되었습니다.
// (런타임은 nodejs 고정, edge 미지원 — Supabase SSR 세션 갱신에는 문제 없음)
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Supabase 미설정 시 인증 처리를 건너뛰어 전체 사이트가 정상 동작하도록 함
  if (!isSupabaseConfigured()) {
    return supabaseResponse
  }

  const supabase = createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 토큰 자동 갱신 (모든 요청에서 세션 유지)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // 공용(공지·뉴스)과 랜딩/인증만 개방, 나머지 학습 영역과 관리자는 로그인 필수.
  const PROTECTED_PREFIXES = ['/dashboard', '/study', '/mock-exam', '/guide', '/admin', '/settings', '/onboarding']
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/auth/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 관리자 영역: 로그인 + 관리자 권한 필수(현재까지 proxy 가 권한을 강제하지 않던 갭 차단).
  // 부트스트랩(ADMIN_EMAILS) 또는 DB 역할(profiles.role)로 판정. 비관리자는 대시보드로.
  // 정확 매칭(=== '/admin' 또는 '/admin/' 하위)으로 '/admin-xxx' 같은 무관 경로 오탐 방지.
  const isAdminArea = pathname === '/admin' || pathname.startsWith('/admin/')
  if (isAdminArea && user && !(await isUserAdmin(supabase, user))) {
    const home = request.nextUrl.clone()
    home.pathname = '/dashboard'
    home.search = ''
    return NextResponse.redirect(home)
  }

  // 이미 로그인된 사용자가 auth 페이지 접근 시 대시보드로
  if (user && pathname.startsWith('/auth') && !pathname.startsWith('/auth/confirm')) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
