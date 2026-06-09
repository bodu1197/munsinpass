import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// Pretendard Variable — 한글 화면 장문 가독성 최적화 (프로젝트 내장, 오프라인 안전)
const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${SITE_NAME} - 문신사 국가시험 대비`,
  description:
    "2027년 문신사 국가시험을 체계적으로 대비하세요. 과목별 문제풀이, 실전 모의고사, 오답노트, 실기 체크리스트를 제공합니다.",
  applicationName: SITE_NAME,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
  openGraph: {
    title: `${SITE_NAME} - 문신사 국가시험 대비`,
    description: "2027년 문신사 국가시험, 합격까지 한 곳에서 준비하세요.",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - 문신사 국가시험 대비`,
    description: "2027년 문신사 국가시험, 합격까지 한 곳에서 준비하세요.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdfbf7" },
    { media: "(prefers-color-scheme: dark)", color: "#1a202c" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
