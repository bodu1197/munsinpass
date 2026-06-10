// L2 — GPT 실시간 문제 생성 (서버 전용, 키 노출 방지)
// 약점 과목·난이도를 받아 OpenAI Structured Outputs로 원본 예상문항을 생성·검증해 반환.
// 키 미설정 시 enabled:false 로 graceful degradation (앱은 L1 적응형으로 정상 동작).
// ⚠️ 기출 원문 복제 금지 — 공개 출제기준 범위로 원본 창작하도록 프롬프트에 명시.

import { SUBJECT_MAP, type SubjectKey } from '@/data/questions'
import { topicsForSubject } from '@/data/blueprint'
import { createClient } from '@/utils/supabase/server'
import { isSupabaseConfigured } from '@/utils/supabase/config'
import { rateLimit, type RateLimitRule } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 30

const SUBJECT_KEYS: SubjectKey[] = ['hygiene', 'anatomy', 'ink_material', 'law']

// 버스트 가드: 식별자(사용자 또는 IP)당 60초에 10회. OpenAI 호출 비용 폭주 방지.
const RATE_LIMIT: RateLimitRule = { windowMs: 60_000, max: 10 }

// 식별자용 클라이언트 IP. ⚠️ x-forwarded-for 는 위조 가능 → 데모 모드 베스트-에포트 전용.
// (프로덕션은 user.id 로 키잉하므로 IP 위조가 레이트리밋에 영향을 주지 않는다.)
function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0].trim()
    if (first) return first
  }
  return req.headers.get('x-real-ip')?.trim() || 'unknown'
}

function apiKey(): string | null {
  const k = (process.env.OPENAI_API_KEY || '').trim()
  if (!k || !k.startsWith('sk') || k.includes('your-')) return null
  return k
}

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          subject: { type: 'string', enum: SUBJECT_KEYS },
          topic: { type: 'string' },
          difficulty: { type: 'integer', enum: [1, 2, 3] },
          question: { type: 'string' },
          choices: { type: 'array', items: { type: 'string' } },
          answer: { type: 'integer' },
          explanation: { type: 'string' },
        },
        required: ['subject', 'topic', 'difficulty', 'question', 'choices', 'answer', 'explanation'],
      },
    },
  },
  required: ['items'],
}

const SYSTEM = `당신은 한국 '문신사 국가시험'(2027 시행 예정, 미용사 시험과 과목이 겹침) 대비 **학습용 예상문제** 출제 전문가다.
규칙:
- 4지선다 객관식. 각 문항: question, choices(보기 4개), answer(정답 0-based 인덱스 0~3), explanation(정답 근거를 원리로 설명, 존댓말), difficulty(1=하·2=중·3=상), subject, topic.
- 보기 4개는 모두 그럴듯하게, 정답은 정확히 하나.
- 이모지 절대 금지. 한국어로 작성.
- 매우 중요: 실제 기출문제를 그대로 베끼지 말 것. 개념을 묻는 새 문항을 창작하라.
- 법령/수치는 세부 출제기준 미공개이므로 무리한 단정 대신 일반 원칙·정설 위주로.`

function buildUserPrompt(subjects: SubjectKey[], difficulty: number, count: number, avoid: string[]) {
  const lines = subjects.map((s) => {
    const label = SUBJECT_MAP[s]?.label ?? s
    const topics = topicsForSubject(s).map((t) => `${t.key}(${t.label})`).join(', ')
    return `- ${s} = ${label}; 세부항목 topic 후보: ${topics}`
  })
  const diffLabel = difficulty <= 1.6 ? '하(쉬움)' : difficulty >= 2.4 ? '상(어려움)' : '중(보통)'
  const avoidNote = avoid.length
    ? `\n다음과 의미가 겹치는 문항은 피하라(중복 금지): ${avoid.slice(0, 40).map((a) => a.slice(0, 30)).join(' / ')}`
    : ''
  return `다음 과목에서 총 ${count}문항을 생성하라. 각 문항의 subject는 아래 키 중 하나, topic은 해당 과목의 세부항목 키 중 하나로 정확히 채운다.
${lines.join('\n')}

난이도 목표: ${diffLabel} (difficulty 값으로 표현). 과목을 고르게 분배.${avoidNote}

items 배열로만 출력.`
}

function isClean(q: { question: string; choices: string[]; answer: number; difficulty: number; subject: string }) {
  if (!q.question || q.question.length < 8) return false
  if (!Array.isArray(q.choices) || q.choices.length !== 4) return false
  if (q.choices.some((c) => !c || !c.trim())) return false
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) return false
  if (![1, 2, 3].includes(q.difficulty)) return false
  if (!SUBJECT_KEYS.includes(q.subject as SubjectKey)) return false
  // 이모지 등 비정상 문자 필터
  if (/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(q.question + q.choices.join(''))) return false
  return true
}

function uid() {
  try {
    return (globalThis.crypto?.randomUUID?.() || '').slice(0, 8)
  } catch {
    return Math.random().toString(36).slice(2, 10)
  }
}

export async function POST(req: Request) {
  // 1) 인증 — 무인증 직접 호출 차단. Supabase 구성 시 로그인 사용자만 허용.
  //    프로덕션에서는 Supabase 미구성(환경변수 누락 등)이어도 인증을 강제한다(fail-closed):
  //    비싼 OpenAI 엔드포인트가 오구성으로 무방비 노출되는 것을 방지.
  //    데모/개발(비프로덕션 + Supabase 미구성)에서만 인증을 건너뛰고 IP 기준 레이트리밋.
  // 인증 생략은 "데모"에서만: 비프로덕션 AND Supabase 미구성. 그 외(프로덕션이거나
  // Supabase 구성됨)는 모두 인증 강제. ⚠️ 이 식을 단순화하지 말 것 — 프로덕션 fail-closed가 깨짐.
  const isDemoMode = process.env.NODE_ENV !== 'production' && !isSupabaseConfigured()
  const requireAuth = !isDemoMode
  let identity: string
  if (requireAuth) {
    let userId: string | null = null
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      userId = user?.id ?? null
    } catch {
      userId = null // 인증 백엔드 장애/오구성 → 미인증으로 간주(fail-closed)
    }
    if (!userId) {
      // enabled 필드 생략: 미인증 응답이 OpenAI 키 구성 여부를 드러내지 않도록(클라는 status로 분기).
      return Response.json(
        { questions: [], error: '로그인이 필요합니다.' },
        { status: 401 },
      )
    }
    identity = `u:${userId}`
  } else {
    identity = `ip:${clientIp(req)}`
  }

  // 2) 키 확인 — 미설정 시 비용 없이 즉시 비활성 응답(graceful degradation).
  const key = apiKey()
  if (!key) {
    return Response.json({ enabled: false, questions: [], reason: 'OPENAI_API_KEY 미설정' })
  }

  // 3) 레이트리밋 — 실제 OpenAI 호출 직전에만 카운트(버스트 방지).
  const rl = rateLimit(identity, RATE_LIMIT)
  if (!rl.ok) {
    return Response.json(
      { questions: [], error: '요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } },
    )
  }

  let body: { subjects?: string[]; difficulty?: number; count?: number; avoid?: string[] } = {}
  try {
    body = await req.json()
  } catch {
    /* 빈 본문 허용 */
  }
  const subjects = (Array.isArray(body.subjects) && body.subjects.length
    ? body.subjects
    : SUBJECT_KEYS
  ).filter((s): s is SubjectKey => SUBJECT_KEYS.includes(s as SubjectKey))
  const difficulty = typeof body.difficulty === 'number' ? body.difficulty : 2
  const count = Math.min(20, Math.max(1, body.count ?? 6))
  const avoid = Array.isArray(body.avoid) ? body.avoid.filter((x) => typeof x === 'string') : []
  const model = (process.env.OPENAI_MODEL || 'gpt-4o-mini').trim()

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: AbortSignal.timeout(20_000), // Vercel maxDuration(30s) 보호: OpenAI 응답 지연 시 행(hang) 방지
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.85,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: buildUserPrompt(subjects.length ? subjects : SUBJECT_KEYS, difficulty, count, avoid) },
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'questions', strict: true, schema: SCHEMA } },
      }),
    })
    if (!res.ok) {
      const t = await res.text()
      return Response.json({ enabled: true, questions: [], error: `OpenAI ${res.status}: ${t.slice(0, 200)}` }, { status: 502 })
    }
    const j = await res.json()
    const content = j?.choices?.[0]?.message?.content
    const parsed = JSON.parse(content || '{"items":[]}')
    const raw = Array.isArray(parsed.items) ? parsed.items : []
    const seen = new Set<string>()
    const norm = (s: string) => (s || '').toLowerCase().replace(/\s+/g, '')
    const avoidSet = new Set(avoid.map(norm))
    const questions = raw
      .filter((q: { question: string; choices: string[]; answer: number; difficulty: number; subject: string }) => isClean(q))
      .filter((q: { question: string }) => {
        const k = norm(q.question)
        if (avoidSet.has(k) || seen.has(k)) return false
        seen.add(k)
        return true
      })
      .map((q: { subject: string; topic: string; difficulty: number; question: string; choices: string[]; answer: number; explanation: string }) => ({
        id: `ai-${q.subject}-${uid()}`,
        subject: q.subject,
        topic: q.topic,
        type: 'mcq' as const,
        source: 'ai' as const,
        difficulty: q.difficulty,
        question: q.question,
        choices: q.choices,
        answer: q.answer,
        explanation: q.explanation,
      }))
    return Response.json({ enabled: true, questions, generated: raw.length, kept: questions.length })
  } catch (e) {
    return Response.json({ enabled: true, questions: [], error: String(e).slice(0, 200) }, { status: 500 })
  }
}
