// 게시된 뉴스 읽기(서버 컴포넌트/사이트맵/RSS 용).
// 쿠키 없는 공개 anon 읽기(published RLS) + unstable_cache(tag 'news') → 방문마다 Supabase 조회하지 않음.
// 새 글 게시/승인 시 cron·actions 에서 revalidateTag('news', 'max') 로 갱신.

import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from '@/utils/supabase/config'
import type { Database } from '@/utils/supabase/types'

export interface PublishedNews {
  slug: string
  title: string
  summary: string
  sourceName: string
  sourceUrl: string
  tier: number
  category: string | null
  publishedAt: string | null
}

interface NewsRow {
  slug: string
  title: string
  summary: string
  source_name: string
  source_url: string
  tier: number
  category: string | null
  published_at: string | null
}

const COLUMNS = 'slug,title,summary,source_name,source_url,tier,category,published_at'
const CACHE_OPTS = { tags: ['news'], revalidate: 600 }

// 쿠키 미사용 → unstable_cache 안에서 호출 가능. published 만 RLS 로 노출.
function publicClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function mapRow(r: NewsRow): PublishedNews {
  return {
    slug: r.slug,
    title: r.title,
    summary: r.summary,
    sourceName: r.source_name,
    sourceUrl: r.source_url,
    tier: r.tier,
    category: r.category,
    publishedAt: r.published_at,
  }
}

async function fetchPublished(limit: number): Promise<PublishedNews[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const { data, error } = await publicClient()
      .from('news_items')
      .select(COLUMNS)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit)
    if (error || !data) return []
    return (data as NewsRow[]).map(mapRow)
  } catch {
    return []
  }
}

export const getPublishedNews = unstable_cache(fetchPublished, ['published-news'], CACHE_OPTS)

async function fetchBySlug(slug: string): Promise<PublishedNews | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const { data, error } = await publicClient()
      .from('news_items')
      .select(COLUMNS)
      .eq('status', 'published')
      .eq('slug', slug)
      .maybeSingle()
    if (error || !data) return null
    return mapRow(data as NewsRow)
  } catch {
    return null
  }
}

export const getNewsBySlug = unstable_cache(fetchBySlug, ['news-by-slug'], CACHE_OPTS)

async function fetchSlugs(limit: number): Promise<{ slug: string; publishedAt: string | null }[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const { data, error } = await publicClient()
      .from('news_items')
      .select('slug,published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit)
    if (error || !data) return []
    return (data as { slug: string; published_at: string | null }[]).map((r) => ({
      slug: r.slug,
      publishedAt: r.published_at,
    }))
  } catch {
    return []
  }
}

export const getPublishedSlugs = unstable_cache(fetchSlugs, ['news-slugs'], CACHE_OPTS)
