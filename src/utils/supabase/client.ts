import { createBrowserClient } from '@supabase/ssr'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config'
import type { Database } from './types'

// 브라우저(클라이언트 컴포넌트)용 Supabase 클라이언트.
// @supabase/ssr 의 createBrowserClient 를 사용해야 서버(쿠키) 세션과 공유됩니다.
export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
}
