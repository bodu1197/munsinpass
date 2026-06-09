import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

// PWA(서비스워커)는 기본 비활성. 활성화하려면 .env 에 NEXT_PUBLIC_PWA=true 설정 후
// dev/build 스크립트를 webpack 모드로 실행하세요 (serwist 는 Turbopack 미지원).
const PWA_ENABLED = process.env.NEXT_PUBLIC_PWA === "true";

// Content-Security-Policy — 자기 출처 + Supabase(브라우저 클라이언트) 허용.
// 인라인 스타일(Tailwind/Next)·인라인 스크립트(Next 부트스트랩·JSON-LD)는 'unsafe-inline' 필요.
// OpenAI 호출은 서버(라우트 핸들러)에서만 일어나므로 브라우저 connect-src 에 불필요.
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  // Next.js 16 기본값인 Turbopack 명시적 허용
  turbopack: {},
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: !PWA_ENABLED,
});

// PWA 비활성 시 serwist 래핑을 생략 → webpack 주입이 없어 Turbopack 빌드와 충돌하지 않음.
export default PWA_ENABLED ? withSerwist(nextConfig) : nextConfig;
