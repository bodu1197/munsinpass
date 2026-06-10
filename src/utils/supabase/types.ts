// 수동 Supabase Database 타입 — supabase CLI(gen types) 없이 컬럼 타입 안전 확보.
// 목적: from()/insert()/update() 의 테이블·컬럼 오타를 컴파일 타임에 차단.
// ⚠️ supabase/migrations 변경 시 이 파일을 함께 갱신할 것.

export type NewsStatus = 'draft' | 'published' | 'rejected'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; email: string | null; nickname: string | null; role: string; created_at: string }
        Insert: { id: string; email?: string | null; nickname?: string | null; role?: string; created_at?: string }
        Update: { email?: string | null; nickname?: string | null; role?: string }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: number
          actor_id: string | null
          actor_email: string | null
          action: string
          target_type: string | null
          target_id: string | null
          changes: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          actor_id?: string | null
          actor_email?: string | null
          action: string
          target_type?: string | null
          target_id?: string | null
          changes?: Record<string, unknown> | null
          created_at?: string
        }
        Update: { action?: string }
        Relationships: []
      }
      entitlements: {
        Row: {
          user_id: string
          status: 'none' | 'active' | 'self_closed'
          access_until: string | null
          source: 'paid' | 'manual' | 'grandfather'
          passed_reported_at: string | null
          granted_at: string | null
          updated_at: string
        }
        Insert: {
          user_id: string
          status?: 'none' | 'active' | 'self_closed'
          access_until?: string | null
          source?: 'paid' | 'manual' | 'grandfather'
          passed_reported_at?: string | null
          granted_at?: string | null
          updated_at?: string
        }
        Update: {
          status?: 'none' | 'active' | 'self_closed'
          access_until?: string | null
          source?: 'paid' | 'manual' | 'grandfather'
          passed_reported_at?: string | null
          granted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: number
          user_id: string
          payment_id: string
          amount: number
          status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded'
          method: string | null
          provider: string
          receipt_url: string | null
          raw: Record<string, unknown> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          payment_id: string
          amount: number
          status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded'
          method?: string | null
          provider?: string
          receipt_url?: string | null
          raw?: Record<string, unknown> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded'
          method?: string | null
          receipt_url?: string | null
          raw?: Record<string, unknown> | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_webhooks: {
        Row: { event_id: string; payload: Record<string, unknown>; processed: boolean; created_at: string }
        Insert: { event_id: string; payload: Record<string, unknown>; processed?: boolean; created_at?: string }
        Update: { processed?: boolean }
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
