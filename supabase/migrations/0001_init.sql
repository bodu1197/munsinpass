-- 문신패스 초기 스키마
-- Supabase 대시보드 > SQL Editor 에 붙여넣어 실행하거나 supabase CLI 로 적용하세요.

-- ───────────────────────── profiles ─────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  nickname text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 본인 프로필만 조회/수정
drop policy if exists "프로필 조회(본인)" on public.profiles;
create policy "프로필 조회(본인)" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "프로필 수정(본인)" on public.profiles;
create policy "프로필 수정(본인)" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "프로필 생성(본인)" on public.profiles;
create policy "프로필 생성(본인)" on public.profiles
  for insert with check (auth.uid() = id);

-- 회원가입 시 프로필 자동 생성 (user_metadata.nickname 사용)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nickname)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nickname', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────── user_answers (선택: 서버 진도 동기화용) ─────────────────────────
-- 현재 앱은 진도를 브라우저 localStorage 에 저장합니다.
-- 기기 간 동기화가 필요해지면 아래 테이블로 서버 저장으로 확장할 수 있습니다.
create table if not exists public.user_answers (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id text not null,
  subject text not null,
  is_correct boolean not null,
  solved_at timestamptz not null default now()
);

create index if not exists user_answers_user_idx on public.user_answers (user_id);
create index if not exists user_answers_solved_idx on public.user_answers (user_id, solved_at);

alter table public.user_answers enable row level security;

drop policy if exists "내 답안 조회" on public.user_answers;
create policy "내 답안 조회" on public.user_answers
  for select using (auth.uid() = user_id);

drop policy if exists "내 답안 기록" on public.user_answers;
create policy "내 답안 기록" on public.user_answers
  for insert with check (auth.uid() = user_id);
