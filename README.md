# 문신패스 (MuShinPass)

2027년 시행 예정인 **문신사 국가시험** 대비 PWA 학습 플랫폼입니다.

- **Next.js 16** (App Router · Turbopack) · React 19 · TypeScript · Tailwind CSS v4
- 인증/프로필: **Supabase** (`@supabase/ssr`) — **회원가입(로그인) 필수**. 랜딩(`/`)과 인증 페이지를 제외한 모든 기능은 로그인해야 이용 가능
- 학습 진도: **브라우저 localStorage** (오프라인 친화적)
- PWA: **Serwist** (기본 비활성, `NEXT_PUBLIC_PWA=true`로 활성화)

> 🔒 **로그인 필수** 서비스입니다. 로그인은 Supabase 연결이 있어야 동작하며,
> Supabase 미설정 시에는 로컬에서 **미리보기(데모)** 로만 둘러볼 수 있습니다(상단에 안내 배너 표시).

## 주요 기능

| 경로 | 설명 |
| --- | --- |
| `/` | 랜딩 · D-Day · 기능 소개 |
| `/study` · `/study/[subject]` | 과목별 문제풀이 (학습/시험 모드) |
| `/mock-exam` | 실전 모의고사 (타이머 · 자동 채점 · 과목별 분석) |
| `/study/wrong-answers` | 틀린 문제 모아 복습 (오답노트) |
| `/study/checklist` | 실기 위생 순서 체크리스트 (암기 모드) |
| `/guide` | 시험 안내 · 일정 · FAQ |
| `/community` | 커뮤니티 게시판 (현재 localStorage 기반) |
| `/dashboard` | 학습 통계 |

> 위 기능(`/study`·`/mock-exam`·`/community`·`/guide`·`/dashboard`)은 모두 **로그인 필수**입니다. (`src/proxy.ts`에서 게이트)

> ⚠️ 문제는 **학습용 예상문제(샘플)**입니다. 실제 국가시험 문제와 다를 수 있습니다.
> 문항은 `src/data/questions.ts`, 체크리스트는 `src/data/checklist.ts`에서 추가·수정합니다.

## 실행

```bash
npm install
npm run dev          # http://localhost:3000 (Turbopack)
npm run build && npm run start
```

## Supabase 설정 (로그인 필수 — 권장)

이 서비스는 **회원가입 후 이용**이 원칙입니다. 로그인을 실제로 동작시키려면 Supabase 연결이 필요합니다.
(미설정 시에는 로컬에서 미리보기로만 둘러볼 수 있습니다.)

1. `.env.local` 에 키 입력:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   # (선택) 배포 도메인
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   ```
2. Supabase 대시보드 > SQL Editor 에서 `supabase/migrations/0001_init.sql` 실행
   (profiles 테이블 + 회원가입 시 프로필 자동 생성 트리거 + RLS).
3. 이메일 확인을 사용하는 경우 콜백은 `/auth/confirm` 에서 처리됩니다.

## PWA 활성화 (선택)

Serwist는 현재 Turbopack을 지원하지 않아 기본 비활성입니다. 활성화하려면:

```bash
# .env.local
NEXT_PUBLIC_PWA=true
```
```bash
npm run pwa:dev      # next dev --webpack
npm run pwa:build    # next build --webpack
```

## 메모

- Next.js 16에서 `middleware` 는 **`proxy`** 로 변경되었습니다 → 세션 처리는 `src/proxy.ts`.
- 기기 간 진도 동기화가 필요하면 `supabase/migrations/0001_init.sql` 의 `user_answers`
  테이블을 활성화하고 `src/lib/progress.ts` 를 서버 저장으로 확장하세요.
