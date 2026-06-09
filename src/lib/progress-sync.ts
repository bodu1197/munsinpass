'use client'

// 진도 동기화 (localStorage ↔ Supabase user_answers)
// 로그인 상태면: 서버 답안을 로컬로 당겨 병합(기기 간 유지) + 로컬에만 있는 답안을 서버에 기록.
// Supabase 미설정/비로그인 시 아무 것도 하지 않음(로컬 전용으로 정상 동작).

import { createClient } from '@/utils/supabase/client'
import { isSupabaseConfigured } from '@/utils/supabase/config'
import { getAnswers, mergeAnswers, answerKey, type AnswerRecord } from './progress'

interface ServerRow {
  question_id: string
  subject: string
  is_correct: boolean
  solved_at: string
}

let syncing = false

export async function syncProgress(): Promise<{ pulled: number; pushed: number } | null> {
  if (!isSupabaseConfigured() || typeof window === 'undefined' || syncing) return null
  syncing = true
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    // 1) 서버 답안 조회
    const { data, error } = await supabase
      .from('user_answers')
      .select('question_id,subject,is_correct,solved_at')
      .eq('user_id', user.id)
    if (error) return null

    const rows = (data ?? []) as ServerRow[]
    const serverRecs: AnswerRecord[] = rows.map((r) => ({
      questionId: r.question_id,
      subject: r.subject as AnswerRecord['subject'],
      correct: r.is_correct,
      at: new Date(r.solved_at).getTime(),
    }))
    const serverKeys = new Set(serverRecs.map(answerKey))

    // 2) 로컬(병합 전) 기준으로 서버에 없는 답안 추출 → 푸시 대상
    const localBefore = getAnswers()
    const toPush = localBefore.filter((a) => a.questionId && !serverKeys.has(answerKey(a)))

    // 3) 서버 → 로컬 병합(다른 기기 답안 반영)
    mergeAnswers(serverRecs)

    // 4) 로컬 전용 답안을 서버에 기록
    let pushed = 0
    if (toPush.length) {
      const payload = toPush.map((a) => ({
        user_id: user.id,
        question_id: a.questionId,
        subject: a.subject,
        is_correct: a.correct,
        solved_at: new Date(a.at).toISOString(),
      }))
      const { error: insErr } = await supabase.from('user_answers').insert(payload)
      if (!insErr) pushed = payload.length
    }

    return { pulled: serverRecs.length, pushed }
  } catch {
    return null
  } finally {
    syncing = false
  }
}
