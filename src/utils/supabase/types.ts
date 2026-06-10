// 수동 Supabase Database 타입 — supabase CLI(gen types) 없이 컬럼 타입 안전 확보.
// 목적: from()/insert()/update() 의 테이블·컬럼 오타를 컴파일 타임에 차단.
// ⚠️ supabase/migrations 변경 시 이 파일을 함께 갱신할 것.

export type NewsStatus = 'draft' | 'published' | 'rejected'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; email: string | null; nickname: string | null; created_at: string }
        Insert: { id: string; email?: string | null; nickname?: string | null; created_at?: string }
        Update: { email?: string | null; nickname?: string | null }
        Relationships: []
      }
      user_answers: {
        Row: {
          id: number
          user_id: string
          question_id: string
          subject: string
          is_correct: boolean
          solved_at: string
        }
        Insert: {
          user_id: string
          question_id: string
          subject: string
          is_correct: boolean
          solved_at?: string
        }
        Update: { is_correct?: boolean; solved_at?: string }
        Relationships: []
      }
      news_items: {
        Row: {
          id: number
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
          status: NewsStatus
          published_at: string | null
          created_at: string
        }
        Insert: {
          slug: string
          title: string
          summary: string
          source_name: string
          source_url: string
          source_domain: string
          tier: number
          category?: string | null
          relevance?: number | null
          url_hash: string
          status?: NewsStatus
          published_at?: string | null
          created_at?: string
        }
        Update: { status?: NewsStatus; published_at?: string | null }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
