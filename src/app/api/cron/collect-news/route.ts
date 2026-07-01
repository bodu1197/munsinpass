// 뉴스 자동수집 cron 엔드포인트 (하루 2회, vercel.json 의 crons 가 호출).
// 흐름: 인증 → 후보 수집(collect) → 기존 url_hash 제외 → AI 요약 → tier 분기(공식 자동게시/언론 초안) → 저장.
// Vercel Cron 은 CRON_SECRET 설정 시 Authorization: Bearer <secret> 헤더를 자동 주입한다.

import { revalidateTag } from 'next/cache'
import { collectCandidates, type Candidate } from '@/lib/news/collect'
import { summarizeNews } from '@/lib/news/summarize'
import { deleteExpiredDrafts, DRAFT_EXPIRY_DAYS } from '@/lib/news/cleanup'
import { createAdminClient, isAdminConfigured } from '@/utils/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MAX_NEW_PER_RUN = 10 // 1회 처리 상한(비용·시간 보호)
const MIN_RELEVANCE = 5 // 관련도 미만이면 폐기

interface NewsInsert {
  slug: string
  title: string
  summary: string
  source_name: string
  source_url: string
  source_domain: string
  tier: number
  category: string | null
  relevance: number | null
  url_hash: string
  status: 'published' | 'draft'
  published_at: string | null
}

function authorized(req: Request): boolean {
  const secret = (process.env.CRON_SECRET || '').trim()
  if (!secret) return false // fail-closed: 시크릿 미설정이면 차단(.env.local·Vercel 모두 CRON_SECRET 설정 필요)
  return req.headers.get('authorization') === `Bearer ${secret}`
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out = new Array<R>(items.length)
  let cursor = 0
  async function worker() {
    while (cursor < items.length) {
      const idx = cursor++
      out[idx] = await fn(items[idx])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return out
}

async function buildRow(c: Candidate): Promise<NewsInsert | null> {
  const ai = await summarizeNews({ title: c.title, snippet: c.snippet, sourceName: c.sourceName })
  const relevance = ai?.relevance ?? null
  if (relevance !== null && relevance < MIN_RELEVANCE) return null // 관련 없음 → 폐기
  const summary = ai?.summary ?? (c.snippet || c.title)
  const status: 'published' | 'draft' = c.tier === 1 ? 'published' : 'draft'
  return {
    slug: c.slug,
    title: c.title,
    summary,
    source_name: c.sourceName,
    source_url: c.url,
    source_domain: c.domain,
    tier: c.tier,
    category: ai?.category ?? null,
    relevance,
    url_hash: c.urlHash,
    status,
    // RSS 원문 발행일을 초안에도 저장 → 승인 시 원문일 보존(공개는 status 로 게이트되어 무해)
    published_at: c.publishedAt ?? (status === 'published' ? new Date().toISOString() : null),
  }
}

async function handle(req: Request): Promise<Response> {
  if (!authorized(req)) {
    return Response.json({ ok: false, reason: 'unauthorized' }, { status: 401 })
  }
  if (!isAdminConfigured()) {
    return Response.json({ ok: false, reason: 'SUPABASE_SERVICE_ROLE_KEY 미설정' }, { status: 503 })
  }

  const admin = createAdminClient()

  // 만료 정리(draft 3일 경과)와 수집은 서로 무관 → 병렬 실행(수집 실패해도 정리는 항상 시도)
  const [cleanup, candidates] = await Promise.all([
    deleteExpiredDrafts(admin, DRAFT_EXPIRY_DAYS),
    collectCandidates(),
  ])
  if (cleanup.error) {
    console.error('[collect-news] 만료 draft 삭제 실패:', cleanup.error)
  }

  if (candidates.length === 0) {
    return Response.json({
      ok: true,
      collected: 0,
      inserted: 0,
      published: 0,
      drafted: 0,
      deleted: cleanup.deleted,
      deletedError: cleanup.error ?? undefined,
    })
  }

  // 이미 저장된 항목 제외
  const { data: existing, error: existingError } = await admin
    .from('news_items')
    .select('url_hash')
    .in('url_hash', candidates.map((c) => c.urlHash))
  if (existingError) {
    console.error('[collect-news] 기존 url_hash 조회 실패(중복 검사 생략됨):', existingError.message)
  }
  const known = new Set(((existing as { url_hash: string }[] | null) ?? []).map((r) => r.url_hash))

  const fresh = candidates.filter((c) => !known.has(c.urlHash)).slice(0, MAX_NEW_PER_RUN)
  if (fresh.length === 0) {
    return Response.json({
      ok: true,
      collected: candidates.length,
      inserted: 0,
      published: 0,
      drafted: 0,
      deleted: cleanup.deleted,
      deletedError: cleanup.error ?? undefined,
    })
  }

  const built = await mapWithConcurrency(fresh, 2, buildRow)
  const rows = built.filter((r): r is NewsInsert => r !== null)
  if (rows.length === 0) {
    return Response.json({
      ok: true,
      collected: candidates.length,
      inserted: 0,
      published: 0,
      drafted: 0,
      deleted: cleanup.deleted,
      deletedError: cleanup.error ?? undefined,
    })
  }

  const { error } = await admin
    .from('news_items')
    .upsert(rows, { onConflict: 'url_hash', ignoreDuplicates: true })
  if (error) {
    return Response.json({ ok: false, reason: error.message, deleted: cleanup.deleted }, { status: 500 })
  }

  revalidateTag('news', 'max') // 게시 뉴스 캐시 무효화(stale-while-revalidate)

  return Response.json({
    ok: true,
    collected: candidates.length,
    inserted: rows.length,
    published: rows.filter((r) => r.status === 'published').length,
    drafted: rows.filter((r) => r.status === 'draft').length,
    deleted: cleanup.deleted,
    deletedError: cleanup.error ?? undefined,
  })
}

export async function GET(req: Request): Promise<Response> {
  return handle(req)
}

export async function POST(req: Request): Promise<Response> {
  return handle(req)
}
