-- ───────────────────────── 결제·이용권 (Phase 2 기초) ─────────────────────────
-- 모델: 23,000원 일회성 결제 → entitlements.status='active'(무기한, access_until=NULL).
--       합격 시 회원이 자가신고 → status='self_closed'.
-- ⚠️ 0003 의 public.is_admin() 에 의존(관리자 전체 조회 정책) — 마이그레이션 순서대로 적용할 것.
-- ⚠️ 적용 후 src/utils/supabase/types.ts 동기 유지(수동 타입).
-- 참고: 접근 게이트(proxy)는 Phase 3 에서 연결 — 이 마이그레이션만으로는 기존 사용자 영향 없음.

-- 이용권(접근권): 사용자별 1행
create table if not exists public.entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  status text not null default 'none' check (status in ('none', 'active', 'self_closed')),
  access_until timestamptz,            -- NULL = 무기한(합격 자가신고로 종료)
  source text not null default 'paid' check (source in ('paid', 'manual', 'grandfather')),
  passed_reported_at timestamptz,      -- 자가신고 합격 시각
  granted_at timestamptz,
  updated_at timestamptz not null default now()
);

-- 결제 내역
create table if not exists public.payments (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  payment_id text not null unique,     -- PortOne paymentId(주문 고유 — 중복 결제 방지)
  amount integer not null,             -- 원(KRW) 정수
  status text not null check (status in ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  method text,
  provider text not null default 'portone',
  receipt_url text,
  raw jsonb,                           -- 검증/웹훅 원본(감사·디버깅)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payments_user_idx on public.payments (user_id);
create index if not exists payments_status_idx on public.payments (status);

-- 웹훅 멱등성(같은 이벤트 중복 처리 방지)
create table if not exists public.payment_webhooks (
  event_id text primary key,
  payload jsonb not null,
  processed boolean not null default false,
  created_at timestamptz not null default now()
);

-- RLS: 본인 조회 + 관리자 전체 조회. 쓰기는 service-role(검증/웹훅)만 → INSERT/UPDATE 정책 없음.
alter table public.entitlements enable row level security;
alter table public.payments enable row level security;
alter table public.payment_webhooks enable row level security;

drop policy if exists "이용권 조회(본인)" on public.entitlements;
create policy "이용권 조회(본인)" on public.entitlements for select using (auth.uid() = user_id);
drop policy if exists "이용권 조회(관리자)" on public.entitlements;
create policy "이용권 조회(관리자)" on public.entitlements for select using (public.is_admin());

drop policy if exists "결제 조회(본인)" on public.payments;
create policy "결제 조회(본인)" on public.payments for select using (auth.uid() = user_id);
drop policy if exists "결제 조회(관리자)" on public.payments;
create policy "결제 조회(관리자)" on public.payments for select using (public.is_admin());
-- payment_webhooks: 정책 없음(service-role 전용)
