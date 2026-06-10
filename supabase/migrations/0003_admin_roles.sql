-- ───────────────────────── 관리자 역할 + 감사 로그 (Phase 1) ─────────────────────────
-- 목적: ADMIN_EMAILS 환경변수 단독 → DB 역할(profiles.role) 기반 권한으로 강화.
--       proxy/페이지/액션 4중 방어 + 관리자 작업 감사 로그.
-- ⚠️ 적용 후 src/utils/supabase/types.ts 와 동기 유지(이 저장소는 수동 타입).

-- profiles 에 역할 컬럼 + CHECK(멱등: 컬럼이 이미 있어도 제약이 확실히 적용되도록 분리)
alter table public.profiles
  add column if not exists role text not null default 'user';
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('user', 'admin', 'superadmin'));

-- RLS 재귀 방지용 헬퍼(SECURITY DEFINER → 내부 select 가 RLS 우회).
-- "현재 로그인 사용자가 관리자인가?" 를 정책에서 안전하게 호출.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'superadmin')
  );
$$;

-- 관리자가 전체 프로필을 조회(회원 관리)할 수 있는 정책. 본인 조회 정책과 공존.
drop policy if exists "프로필 조회(관리자 전체)" on public.profiles;
create policy "프로필 조회(관리자 전체)" on public.profiles
  for select using (public.is_admin());

-- 감사 로그: 관리자 작업 이력
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  actor_email text,
  action text not null,                 -- 'news.approved', 'user.role_changed' 등
  target_type text,                     -- 'news_items', 'profiles' 등
  target_id text,
  changes jsonb,                        -- {"status": {"old": "draft", "new": "published"}}
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_id);

alter table public.audit_logs enable row level security;
-- 읽기는 관리자만(쓰기는 service-role 전용 → 정책 없음)
drop policy if exists "감사로그 조회(관리자)" on public.audit_logs;
create policy "감사로그 조회(관리자)" on public.audit_logs
  for select using (public.is_admin());

-- 부트스트랩: 운영자 본인을 superadmin 으로(이메일 기반, 멱등). 추가 관리자는 관리 UI/수동 승급.
update public.profiles
  set role = 'superadmin'
  where lower(email) = lower('howtattoo@howtattoo.co.kr') and role <> 'superadmin';
