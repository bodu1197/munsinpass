import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { isSupabaseConfigured } from '@/utils/supabase/config'
import { Onboarding } from './onboarding'

export const metadata: Metadata = {
  title: '시작하기 | 문신패스',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login?next=/onboarding')
  }

  return (
    <div className="py-10">
      <Onboarding />
    </div>
  )
}
