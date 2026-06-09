'use server'

// 계정 설정 액션 — 닉네임/비밀번호 변경, 회원 탈퇴(PIPA).
// 인증 폼과 동일하게 useActionState 시그니처 (prevState, formData) 사용.

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { isSupabaseConfigured } from '@/utils/supabase/config'
import { createAdminClient, isAdminConfigured } from '@/utils/supabase/admin'
import type { AuthState } from '@/app/actions/auth'

const NOT_CONFIGURED =
  'Supabase가 설정되지 않아 계정 기능을 사용할 수 없습니다.'

function getString(formData: FormData, key: string) {
  const v = formData.get(key)
  return typeof v === 'string' ? v.trim() : ''
}

export async function updateNickname(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED }
  const nickname = getString(formData, 'nickname')
  if (nickname.length < 1) return { error: '닉네임을 입력해주세요.' }
  if (nickname.length > 20) return { error: '닉네임은 20자 이하로 입력해주세요.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { error } = await supabase.from('profiles').update({ nickname }).eq('id', user.id)
  if (error) return { error: '닉네임 변경에 실패했습니다. 잠시 후 다시 시도해주세요.' }
  // auth user_metadata 도 맞춰 갱신(베스트 에포트)
  await supabase.auth.updateUser({ data: { nickname } })
  return { message: '닉네임이 변경되었습니다.' }
}

export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED }
  const current = getString(formData, 'current')
  const next = getString(formData, 'password')
  const confirm = getString(formData, 'confirm')

  if (next.length < 8) return { error: '새 비밀번호는 8자 이상이어야 합니다.' }
  if (next !== confirm) return { error: '새 비밀번호가 일치하지 않습니다.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return { error: '로그인이 필요합니다.' }

  // 현재 비밀번호 확인(보안): 일치해야 변경 허용
  const { error: signErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: current,
  })
  if (signErr) return { error: '현재 비밀번호가 올바르지 않습니다.' }

  const { error } = await supabase.auth.updateUser({ password: next })
  if (error) return { error: '비밀번호 변경에 실패했습니다. 잠시 후 다시 시도해주세요.' }
  return { message: '비밀번호가 변경되었습니다.' }
}

export async function deleteAccount(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED }
  const confirm = getString(formData, 'confirm')
  if (confirm !== '탈퇴') {
    return { error: '확인을 위해 입력란에 "탈퇴"를 정확히 입력해주세요.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  if (!isAdminConfigured()) {
    return { error: '현재 탈퇴 처리를 사용할 수 없습니다. 운영자에게 문의해주세요.' }
  }

  // service-role 로 계정 삭제 → profiles·user_answers 는 FK ON DELETE CASCADE 로 함께 삭제됨
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return { error: '회원 탈퇴 처리에 실패했습니다. 잠시 후 다시 시도해주세요.' }

  await supabase.auth.signOut()
  // redirect()는 NEXT_REDIRECT 를 throw 하므로 마지막에 호출
  redirect('/')
}
