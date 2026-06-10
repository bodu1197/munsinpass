-- ───────────────────────── 공지 CMS (관리자 콘텐츠 관리) ─────────────────────────
-- 정적 src/data/notices.ts → DB 테이블로 이관. 공개 페이지는 DB 우선·정적 폴백(news 패턴).
-- ⚠️ 0003 의 public.is_admin() 의존(관리자 쓰기 정책) — 순서대로 적용.
-- ⚠️ 적용 후 src/utils/supabase/types.ts 동기 유지.

create table if not exists public.notices (
  id bigint generated always as identity primary key,
  title text not null,
  body text not null,
  pinned boolean not null default false,
  published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists notices_pub_idx on public.notices (published, published_at desc);

alter table public.notices enable row level security;
-- 공개: 게시된 공지만 읽기. 쓰기: 관리자(is_admin)만.
drop policy if exists "공지 조회(게시)" on public.notices;
create policy "공지 조회(게시)" on public.notices for select using (published = true);
drop policy if exists "공지 조회(관리자 전체)" on public.notices;
create policy "공지 조회(관리자 전체)" on public.notices for select using (public.is_admin());
drop policy if exists "공지 작성(관리자)" on public.notices;
create policy "공지 작성(관리자)" on public.notices for insert with check (public.is_admin());
drop policy if exists "공지 수정(관리자)" on public.notices;
create policy "공지 수정(관리자)" on public.notices for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "공지 삭제(관리자)" on public.notices;
create policy "공지 삭제(관리자)" on public.notices for delete using (public.is_admin());

-- 기존 정적 공지 시드(중복 방지: 비어있을 때만)
insert into public.notices (title, body, published_at)
select * from (values
  ('실기 체크리스트 기능 추가', '위생 순서·기구 세팅을 단계별로 점검·암기할 수 있는 실기 체크리스트를 추가했습니다. 암기 모드로 순서를 가려 외워보세요.', timestamptz '2026-06-05'),
  ('예상문제 추가 및 해설 보강', '위생·법규·색소·해부 4개 과목의 예상문제를 추가하고 해설을 보강했습니다. 모든 문항은 학습용 예상문제이며 실제 시험과 다를 수 있습니다.', timestamptz '2026-06-04'),
  ('다크 모드 및 디자인 개편', '장시간 학습 시 눈의 피로를 줄이도록 가독성 중심으로 디자인을 개편하고 다크 모드를 지원합니다.', timestamptz '2026-06-03'),
  ('문신패스 베타 오픈', '2027년 문신사 국가시험 대비 학습 서비스 문신패스가 베타 오픈했습니다. 과목별 문제풀이와 실전 모의고사를 지금 이용해보세요.', timestamptz '2026-06-01')
) as seed(title, body, published_at)
where not exists (select 1 from public.notices);
