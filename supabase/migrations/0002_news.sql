-- 문신패스 — 자동 뉴스 수집/게시 스키마 (news_items)
-- Supabase 대시보드 > SQL Editor 에 붙여넣어 실행하거나 supabase CLI 로 적용하세요.
--
-- 신뢰 정책:
--  · 공개(anon)는 status='published' 행만 SELECT 가능.
--  · INSERT/UPDATE/DELETE 정책 없음 → service-role 키(RLS 우회)로만 쓰기 가능.
--    수집 cron(/api/cron/collect-news)·관리자 승인(actions/news.ts)이 service-role 로 기록한다.

create table if not exists public.news_items (
  id            bigint generated always as identity primary key,
  slug          text not null unique,                 -- SEO URL (yyyy-mm-dd-<hash>)
  title         text not null,                        -- 원문 헤드라인(그대로)
  summary       text not null,                        -- AI 요약(또는 원문 발췌 폴백)
  source_name   text not null,                        -- 예: 보건복지부 / 연합뉴스
  source_url    text not null,                        -- 원문 링크(항상 표시)
  source_domain text not null,                        -- 신뢰 등급 판정 도메인
  tier          smallint not null,                    -- 1=공식  2=언론
  category      text,                                 -- 법령/시험일정/제도/판례/업계/기타
  relevance     smallint,                             -- 1~10 관련도
  url_hash      text not null unique,                 -- 중복 방지(guid 또는 정규화 URL 해시)
  status        text not null default 'draft'
                  check (status in ('draft', 'published', 'rejected')),
  published_at  timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists news_items_status_pub_idx
  on public.news_items (status, published_at desc);

alter table public.news_items enable row level security;

-- 공개: 게시된 뉴스만 읽기 (비로그인 포함)
drop policy if exists "뉴스 공개 조회" on public.news_items;
create policy "뉴스 공개 조회" on public.news_items
  for select using (status = 'published');

-- 쓰기 정책은 의도적으로 두지 않음 → service-role 만 INSERT/UPDATE 가능(RLS 우회).
