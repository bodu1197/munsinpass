'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { isSupabaseConfigured } from '@/utils/supabase/config'

export type AuthState = { error?: string; message?: string } | null

const NOT_CONFIGURED =
  'Supabase가 설정되지 않았습니다. .env.local 에 NEXT_PUBLIC_SUPABASE_URL/ANON_KEY 를 입력하면 로그인 기능이 활성화됩니다.'

function getString(formData: FormData, key: string) {
  const v = formData.get(key)
  return typeof v === 'string' ? v.trim() : ''
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { error: NOT_CONFIGURED }
  }

  const email = getString(formData, 'email')
  const password = getString(formData, 'password')

  if (!email || !password) {
    return { error: '이메일과 비밀번호를 입력해주세요.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' }
  }

  const next = getString(formData, 'next') || '/dashboard'
  // redirect()는 NEXT_REDIRECT 를 throw 하므로 try/catch 밖에서 호출
  redirect(next.startsWith('/') ? next : '/dashboard')
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { error: NOT_CONFIGURED }
  }

  const email = getString(formData, 'email')
  const password = getString(formData, 'password')
  const nickname = getString(formData, 'nickname')

  if (!email || !password) {
    return { error: '이메일과 비밀번호를 입력해주세요.' }
  }
  if (password.length < 8) {
    return { error: '비밀번호는 8자 이상이어야 합니다.' }
  }

  const supabase = await createClient()

  const h = await headers()
  const origin = h.get('origin') ?? (h.get('host') ? `https://${h.get('host')}` : '')

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // 이메일 확인 사용 시 링크가 이 콜백으로 돌아옵니다.
      emailRedirectTo: origin ? `${origin}/auth/confirm?next=/dashboard` : undefined,
      data: { nickname: nickname || email.split('@')[0] },
    },
  })

  if (error) {
    if (error.message?.toLowerCase().includes('registered')) {
      return { error: '이미 가입된 이메일입니다. 로그인해주세요.' }
    }
    return { error: '회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.' }
  }

  // profiles 테이블에 닉네임 저장(베스트 에포트 — 트리거가 있으면 중복 무시).
  if (data.user) {
    try {
      await supabase.from('profiles').upsert(
        {
          id: data.user.id,
          email,
          nickname: nickname || email.split('@')[0],
        },
        { onConflict: 'id' }
      )
    } catch {
      // 테이블 미생성/권한 이슈는 무시 (auth 가입 자체는 성공)
    }
  }

  // 이메일 확인이 켜져 있으면 아직 세션이 없습니다.
  if (!data.session) {
    return {
      message:
        '확인 메일을 보냈습니다. 메일의 링크를 눌러 가입을 완료한 뒤 로그인해주세요.',
    }
  }

  redirect('/dashboard')
}

export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { error: NOT_CONFIGURED }
  }
  const email = getString(formData, 'email')
  if (!email) {
    return { error: '이메일을 입력해주세요.' }
  }
  const supabase = await createClient()
  const h = await headers()
  const origin = h.get('origin') ?? (h.get('host') ? `https://${h.get('host')}` : '')
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: origin ? `${origin}/auth/reset` : undefined,
  })
  if (error) {
    return { error: '재설정 메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요.' }
  }
  // 계정 존재 여부를 노출하지 않도록 항상 동일한 안내를 반환
  return {
    message: '입력하신 이메일로 비밀번호 재설정 링크를 보냈습니다. 메일을 확인해 새 비밀번호를 설정하세요.',
  }
}

export async function logout() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    await supabase.auth.signOut()
  }
  redirect('/')
}
