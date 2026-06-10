import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { isSupabaseConfigured } from '@/utils/supabase/config'
import { isUserAdmin } from '@/lib/admin-access'
import { AdminNav } from './admin-nav'

// 관리자 영역 레이아웃 — proxy 게이트에 더해 페이지 단에서도 권한 재확인(다층 방어).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login?next=/admin')
    if (!(await isUserAdmin(supabase, user))) redirect('/dashboard')
  }

  return (
    <div className="py-4">
      <div className="flex flex-col md:flex-row md:gap-6">
        <AdminNav />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  )
}
