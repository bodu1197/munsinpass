// 게시된 뉴스 읽기(서버 컴포넌트/사이트맵/RSS 용). 공개 RLS(status='published')로 anon 읽기.
// Supabase 미설정 시 빈 배열 → 호출부가 정적 시드로 폴백.

import { createClient } from '@/utils/supabase/server'
import { isSupabaseConfigured } from '@/utils/supabase/config'

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

export async function getPublishedNews(limit = 50): Promise<PublishedNews[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
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

export async function getNewsBySlug(slug: string): Promise<PublishedNews | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
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

export async function getPublishedSlugs(limit = 200): Promise<{ slug: string; publishedAt: string | null }[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
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
