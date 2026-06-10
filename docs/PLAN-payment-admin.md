# 결제(PortOne) 도입 + 최고 관리자 페이지 — 구현 계획서

> 목적: ① 구매한 회원만 학습 플랫폼을 이용(23,000원 일회성, "합격할 때까지")하도록 PortOne 결제 연동, ② 사이트 전체를 운영할 최고 관리자 페이지 신설.
> 작성: 코드베이스 6영역 병렬 분석 + PortOne V2 공식문서 + 한국 전자상거래 법규 조사 기반.

---

## 0. 현황 요약 (분석 결과)

| 영역 | 현재 상태 | 결제/관리자에 필요한데 없는 것 |
|------|-----------|------------------------------|
| **인증** | Supabase SSR(쿠키), `proxy.ts`가 `PROTECTED_PREFIXES`(`/dashboard·/study·/mock-exam·/guide·/admin·/settings·/onboarding`) 로그인 강제 | 결제여부(접근권) 검사 게이트 |
| **관리자 권한** | `ADMIN_EMAILS` 환경변수 + `isAdminEmail()`. /admin/news는 page+action 이중 검사 | ⚠️ **proxy가 /admin 권한을 강제 안 함** → 로그인만 하면 /admin 라우트 진입 가능(페이지 단 차단에 의존). DB 역할 모델 없음 |
| **데이터** | `profiles`(id·email·nickname), `user_answers`, `news_items`. RLS `auth.uid()=…` 패턴, service-role 우회(뉴스·계정삭제) | 결제·접근권·웹훅·감사로그 테이블 |
| **결제** | **전무** (모든 기능 가입 후 무료) | 결제 전체 |
| **콘텐츠 관리** | 뉴스만 DB+검토 UI. 공지·FAQ·문제은행은 `src/data/*.ts` 정적(코드 배포로만 수정) | 회원/결제/콘텐츠/문제/통계 관리 UI |

**플랫폼(유료화 대상) 기능**: 과목별 문제풀이(4과목), 실전 모의고사, 오답노트, 북마크·복습·플래시카드·플래너·용어사전·통계, 실기 체크리스트, 대시보드.
**공개 유지 권장**: 홈, 뉴스, 공지, FAQ, 시험안내(/guide), 약관/개인정보, 교과서(맛보기), 인증, 가격/결제 페이지.

---

## Part 1 — 결제 & 구매회원 전용 접근

### 1.1 비즈니스·법적 결정 (코드보다 먼저)

한국 전자상거래법 조사 결과 **"합격할 때까지"라는 모호한 표현은 그대로 약관에 쓰면 법적 위험**입니다(약관규제법 제5조 "고객에게 유리하게 해석" → 분쟁 시 사업자 불리). 따라서 의도(합격까지 길게 이용)는 유지하되 **법적으로 안전하게 구체화**합니다.

**권장 접근권 모델 (A안 — 분쟁 최소)**
- 23,000원 **일회성 선결제** → 접근권 만료일 부여(예: **첫 국가시험 결과발표 예상 시점까지**, 설정 가능. 기본값 후보: `2028-06-30`).
- 약관 문구: "본 이용권은 결제일부터 **[만료일]**까지 유효하며, 시험 합격 시 회원이 자가신고로 조기 종료할 수 있습니다." → "합격까지"의 취지를 지키면서 **명확한 종료일**로 분쟁 예방.
- **자가신고 합격 종료**(선택): 회원이 "합격 신고" → 접근권 종료(증빙 수집 시 개인정보 최소화).
- ⚠️ 관리자가 임의로 종료하는 모델은 **불공정약관 소지**(공정위) → 지양.

**법적 선결 조건(비코드, 필수)**
1. 사업자등록 + **통신판매업 신고**(관할 시·군·구).
2. **이용약관·환불정책·개인정보처리방침** 페이지(초기화면 링크 노출). 전액환불 불가 조항은 무효 가능 → 환불 가능 사유/비율 명시.
3. 디지털콘텐츠 **청약철회 제한**(제공 개시 후) 고지 + 결제 전 동의 체크.
4. 전자결제 영수증/현금영수증 발급 경로.

> **결정 ① (확정)**: **무기한 + 자가신고** 모델 채택. 결제 시 `entitlements.access_until = NULL`(무기한), `status='active'`. 합격 시 회원이 "합격 신고"로 `status='self_closed'`. ⚠️ 법적 위험(약관규제법상 모호한 기간 해석)을 **명확한 환불정책·약관·결제 전 동의 체크·결제 직후 안내메일**로 완화 필수. 광고에 "합격 보장/탈락 시 환불" 류 표현 금지(부정경쟁방지법).

### 1.2 무료 / 유료 경계 (권장)

| 구분 | 라우트 |
|------|--------|
| **공개(비로그인 OK)** | `/`, `/news`, `/notice`, `/faq`, `/guide`, `/legal/*`, `/pricing`, `/auth/*` |
| **로그인+결제 필수(유료)** | `/dashboard`, `/study/*`, `/mock-exam`, `/textbook`(또는 일부 무료), `/settings`(결제내역은 접근 가능) |
| **로그인만(결제 불필요)** | `/onboarding`, `/billing`(결제 진행), `/settings`(계정·결제) |

> **결정 필요 ②**: 교과서/맛보기를 일부 무료로 열지(전환율↑) 전면 유료화할지.

### 1.3 PortOne V2 연동 아키텍처

> PortOne(옛 아임포트) **V2** 기준. 일회성 결제 → **서버 검증 + 웹훅 이중 확인** 후에만 접근권 부여(클라이언트 응답은 위조 가능, 신뢰 금지).

```
[클라] @portone/browser-sdk V2  PortOne.requestPayment({storeId, channelKey, paymentId, orderName, totalAmount:23000, currency:'KRW', payMethod})
   │  결제창(카드·카카오페이·토스·네이버페이…)
   ▼
[서버] POST /api/payments/verify  ── (1) 토큰 발급 POST api.portone.io/login/api-secret
   │                                 (2) GET api.portone.io/payments/{paymentId}
   │                                 (3) 금액 23000 · status='PAID' 대조
   │                                 (4) payments 기록 + 접근권(entitlement) 부여
   ▼
[웹훅] POST /api/webhooks/portone  ── Standard Webhooks 서명검증(HMAC-SHA256) + 멱등(event_id)
                                      + GET /payments/{paymentId} 재확인 → 접근권 확정(이중 안전망)
```

**환경변수(.env / Vercel)**: `PORTONE_API_SECRET`(서버 전용), `NEXT_PUBLIC_PORTONE_STORE_ID`, `NEXT_PUBLIC_PORTONE_CHANNEL_KEY`, `PORTONE_WEBHOOK_SECRET`. 테스트 채널/시크릿은 별도 발급(프로덕션 시크릿 개발환경 금지).
**웹훅 IP**: `52.78.5.241` 허용. **수수료**: 카드 ~2.0–2.5%(PG 계약별).

### 1.4 데이터 모델 (일회성에 맞게 경량화)

> 분석가는 구독(subscription·billing_cycle·auto_renew)까지 제안했으나, **일회성 모델**이므로 정기결제 기계는 불필요 → 접근권 중심으로 단순화.

**마이그레이션 `0003_billing.sql`**
```sql
-- 접근권(핵심): 사용자별 1행
create table public.entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'none' check (status in ('none','active','expired','self_closed')),
  access_until timestamptz,            -- 만료일(결제 시 설정)
  source text not null default 'paid' check (source in ('paid','manual','grandfather')),
  passed_reported_at timestamptz,      -- 자가신고 합격
  updated_at timestamptz default now()
);
-- 결제 내역
create table public.payments (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  payment_id text unique not null,     -- PortOne paymentId(주문 고유)
  amount integer not null,             -- 원(KRW) 정수
  status text not null check (status in ('pending','paid','failed','cancelled','refunded')),
  method text, provider text default 'portone',
  receipt_url text, raw jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
-- 웹훅 멱등성
create table public.payment_webhooks (
  event_id text primary key, payload jsonb not null,
  processed boolean default false, created_at timestamptz default now()
);
create index payments_user_idx on public.payments(user_id);
-- RLS: 본인 것만 읽기, 쓰기는 service-role(웹훅/검증)만
alter table public.entitlements enable row level security;
alter table public.payments enable row level security;
create policy "내 접근권 조회" on public.entitlements for select using (auth.uid() = user_id);
create policy "내 결제 조회"   on public.payments     for select using (auth.uid() = user_id);
-- (payment_webhooks: RLS on, 정책 없음 → service-role 전용)
```
`src/utils/supabase/types.ts`에 `entitlements·payments·payment_webhooks` 타입 추가(이 저장소는 수동 타입 유지가 함정).

### 1.5 접근 게이트 (`proxy.ts` 확장)

```ts
const PAID_PREFIXES = ['/dashboard','/study','/mock-exam','/textbook'] // 유료
// (로그인 체크 통과 후)
if (user && PAID_PREFIXES.some(p => pathname.startsWith(p))) {
  const ent = await supabase.from('entitlements')
    .select('status,access_until').eq('user_id', user.id).maybeSingle()
  const active = ent?.data?.status === 'active'
    && ent.data.access_until && new Date(ent.data.access_until) > new Date()
  if (!active) return redirect('/pricing')   // 미결제·만료 → 가격 페이지
}
```
- proxy에서 DB 1회 조회(짧음). 캐시/세션 클레임으로 최적화 가능(추후).
- **기존 가입자 grandfathering**: 마이그레이션에서 기존 user에게 `source='grandfather'`, `access_until` 부여(무료/할인 전환 정책).

> **결정 필요 ③**: 기존 회원 무료 유예 기간/할인 정책.

### 1.6 페이지·서버액션

- `/pricing` — 요금제(23,000원, "합격까지"=만료일 명시), 결제 버튼.
- `/billing` — `requestPayment()` 호출(클라), 결제수단 선택.
- `/billing/success` `/billing/fail` — 결과.
- `src/app/api/payments/verify/route.ts` — 서버 검증(인증된 사용자 + 멱등).
- `src/app/api/webhooks/portone/route.ts` — 웹훅(서명검증·멱등·service-role).
- `src/app/actions/billing.ts` — `createOrder()`(paymentId 발급), `reportPass()`(자가신고 종료).
- `/settings`에 "이용권 상태 / 만료일 / 결제내역 / 영수증".
- `src/lib/entitlement.ts` — `getEntitlement(userId)`, `isAccessActive()`(proxy·페이지·액션 공용).

### 1.7 단계 (Part 1)
1. (Sandbox) PortOne 테스트 채널 + env, 데이터 모델 마이그레이션, types.
2. `/pricing`·`/billing` + `requestPayment` + `/verify` 서버검증(테스트 결제 성공).
3. 웹훅 서명검증·멱등 + 접근권 확정.
4. proxy 게이트 + `/settings` 이용권 UI + grandfathering.
5. 약관/환불/개인정보 페이지 + 결제 전 동의.
6. (Go-live) 실 PG 계약·통신판매업·프로덕션 시크릿 전환.

---

## Part 2 — 최고 관리자 페이지

### 2.1 관리자 권한 강화 (현재 갭 수정 — 우선)

현재 `/admin`은 **proxy에서 로그인만** 보고, 권한은 페이지/액션에서 `ADMIN_EMAILS`로만 막습니다. 4중 방어 + DB 역할로 강화:
1. `profiles.role text default 'user'` (또는 `user_roles` 테이블) — `'user'|'admin'|'superadmin'`. 초기 슈퍼관리자는 마이그레이션/수동 지정.
2. `proxy.ts`: `/admin/*` 진입 시 DB role 확인 → 비관리자 404/홈.
3. **RLS**: 관리 대상 테이블(news_items 쓰기, audit_logs 읽기 등)에 `role='admin'` 정책.
4. 페이지·서버액션 `assertAdmin()`를 DB role 기반으로 교체(기존 `isAdminEmail`은 부트스트랩 폴백으로만).
5. **감사 로그** `audit_logs`(actor, action, target, before/after, at) + `logAudit()` 헬퍼 → 모든 관리자 변경 기록.

### 2.2 최고 관리자 기능 (제안 — 우선순위)

> "홈페이지 전체를 분석 후 꼭 있어야 할 기능" 도출. `/admin` 하위 섹션 + 좌측 내비.

| 우선 | 섹션 | 기능 |
|------|------|------|
| **P0** | **대시보드** `/admin` | KPI: 총회원·신규(오늘/주)·결제수·매출(일/월)·활성학습자·평균 정답률·검토대기 뉴스 |
| **P0** | **회원 관리** `/admin/members` | 목록·검색(이메일/닉네임), 가입일, **이용권 상태·만료일**, 학습활동, 수동 접근권 부여/연장/차단, 탈퇴 처리 |
| **P0** | **결제 관리** `/admin/payments` | 결제 내역·필터, 상태, **환불 처리(PortOne 취소 API)**, 웹훅 로그·실패 재처리, 매출 합계 |
| **P1** | **뉴스 관리** `/admin/news`(확장) | 검토대기/게시/반려 **탭**·검색, **직접 작성/수정**, 자동수집 상태 |
| **P1** | **콘텐츠(CMS)** `/admin/content` | **공지·FAQ를 DB로 이관**해 등록/수정/정렬(현재 정적 코드) |
| **P1** | **문제은행** `/admin/questions` | 문제 CRUD, 과목·난이도 필터·통계, **AI 생성 문항 검토/승격**, 정답률 낮은 문항 점검 |
| **P2** | **통계/분석** `/admin/stats` | 가입·매출 추이, 학습시간, 과목별 정답률, 뉴스 클릭, 퍼널(가입→결제 전환율) |
| **P2** | **감사 로그** `/admin/audit` | 관리자 작업 이력 조회 |
| **P2** | **설정** `/admin/settings` | 가격·만료일 정책, 관리자(역할) 관리, 도메인 화이트리스트(뉴스) |

### 2.3 콘텐츠 DB 이관 (P1)
- `notices.ts → notices` 테이블(title·body·published_at·status), `faq.ts → faq`(category·q·a·order). 페이지는 DB 우선·정적 폴백(뉴스와 동일 패턴 재사용).
- 문제은행: 단계적. 우선 AI 생성분(`munshinpass:aiq`)·신규만 DB, 기존 시드는 코드 유지 가능.

### 2.4 단계 (Part 2)
1. DB role + proxy/RLS/액션 4중 강화 + audit_logs(보안 기반).
2. 대시보드 KPI + 회원 관리 + 결제/환불 관리(Part 1 결제와 연동).
3. 뉴스 관리 확장 + 콘텐츠(공지·FAQ) CMS 이관.
4. 문제은행 관리 + 통계 + 설정.

---

## 통합 로드맵

| Phase | 내용 | 의존 |
|-------|------|------|
| **0** | 법적 준비(통신판매업·약관/환불) + 결정 ①②③ 확정 + PortOne 가입/채널 | — |
| **1** | 관리자 권한 강화(DB role·proxy·RLS·감사로그) | — |
| **2** | PortOne 결제 코어(샌드박스): 모델·/pricing·/billing·검증·웹훅·접근권 | 1 |
| **3** | 접근 게이트 적용 + 이용권 UI + grandfathering | 2 |
| **4** | 관리자: 대시보드·회원·결제/환불 | 1·3 |
| **5** | 관리자: 뉴스확장·콘텐츠CMS·문제은행·통계 | 1 |
| **6** | Go-live(실 PG·프로덕션 전환·약관 노출) | 2–5 |

품질: 각 Phase마다 typecheck·lint·build·`/review8`·Playwright 검증(이 저장소 하네스 그대로). 비밀키는 Vercel env, service-role은 server-only 유지.

## 핵심 리스크
- 결제 보안: 클라 응답 신뢰 금지 → 서버검증+웹훅 이중. 멱등성(event_id·paymentId 유니크).
- 법적: 모호한 "합격까지" → 명확 만료일+약관. 전액환불 불가 조항 무효 위험.
- proxy DB 조회 지연 → 캐시/세션 클레임 최적화 여지.
- 관리자 권한: 현재 갭(로그인만으로 /admin 진입 가능) 우선 차단.
