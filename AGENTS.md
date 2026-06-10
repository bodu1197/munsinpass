<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 품질 하네스 (Quality harness)

- **정적 게이트**: `npm run typecheck` (tsc) · `npm run lint` (green) · `npm run build` (Turbopack). 푸시 전 `.githooks/pre-push`가 이 셋을 실행(활성화: `git config core.hooksPath .githooks`). CI: `.github/workflows/ci.yml`.
- **테스트**: 단위 `npm test` (Vitest, `src/**/*.test.ts`) · 스모크 `npm run smoke` (Playwright, `e2e/`, `BASE_URL`·`SMOKE_EMAIL/PASSWORD` 환경변수).
- **`/review8`** (8인 전문가 병렬 리뷰): `.claude/commands/review8.md`. 게이트/트리거 훅은 `.claude/hooks/`에 설치됨. 자동 게이트(커밋 전 강제)를 켜려면 `.claude/settings.json`에 PreToolUse(`review8-gate.mjs`)·PostToolUse(`post-push-trigger-review8.mjs`)를 직접 연결(보안상 에이전트가 자동 설정 못 함).

# 함정 (이 코드베이스 특유 — 반복 실수 금지)

- **`middleware` → `proxy`** (`src/proxy.ts`). `src/middleware.ts` 만들지 말 것.
- **빌드는 Turbopack 유지.** `@serwist/next`는 webpack 주입 → `next build`와 충돌. PWA는 `public/sw.js`(수동 SW)로 처리.
- **`useState` 초기화에서 `Math.random`/`shuffle`/`new Date` 금지** → SSR/클라 불일치(React #418). 클라 전용 랜덤은 `useEffect`에서.
- **Next 16 `revalidateTag(tag, 'max')`** — 2번째 인자 필수. (1-arg deprecated)
- **service-role 클라이언트**(`src/utils/supabase/admin.ts`)는 `import 'server-only'` — 클라 컴포넌트에서 import 금지.
- 아이콘 추가 전 중복 확인(`IconChart` 등 기존 존재). 시험일·D-day는 `src/lib/exam.ts` 단일 출처.
