import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

// PWA(서비스워커)는 기본 비활성. 활성화하려면 .env 에 NEXT_PUBLIC_PWA=true 설정 후
// dev/build 스크립트를 webpack 모드로 실행하세요 (serwist 는 Turbopack 미지원).
const PWA_ENABLED = process.env.NEXT_PUBLIC_PWA === "true";

const nextConfig: NextConfig = {
  // Next.js 16 기본값인 Turbopack 명시적 허용
  turbopack: {},
};

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: !PWA_ENABLED,
});

// PWA 비활성 시 serwist 래핑을 생략 → webpack 주입이 없어 Turbopack 빌드와 충돌하지 않음.
export default PWA_ENABLED ? withSerwist(nextConfig) : nextConfig;
