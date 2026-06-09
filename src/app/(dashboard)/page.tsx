"use client";

import Link from "next/link";
import { useHydrated } from "@/lib/progress";
import { QUESTIONS } from "@/data/questions";
import { NEWS } from "@/data/news";
import {
  IconArrowRight,
  IconBell,
  IconBook,
  IconCalendar,
  IconChecklist,
  IconFileText,
  IconHelp,
  IconHome,
  IconLock,
  IconMessage,
  IconNewspaper,
  IconSparkles,
  IconTimer,
} from "@/components/icons";

function daysUntilExam() {
  const examDate = new Date(2027, 11, 1);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(
    0,
    Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );
}

// 개인화: 로그인해야 이용 가능 — "이걸 쓰면 합격에 가까워진다"를 설명
const PERSONAL_FEATURES = [
  {
    href: "/study",
    Icon: IconBook,
    title: "과목별 문제풀이",
    desc: "위생·법규·색소·해부 전 과목을 학습/시험 모드로. 약한 과목을 집중 공략해 합격선까지 끌어올립니다.",
  },
  {
    href: "/mock-exam",
    Icon: IconTimer,
    title: "실전 모의고사",
    desc: "실제 시험처럼 제한 시간 안에 풀고 자동 채점. 과목별 점수 분석으로 합격 가능성을 점검합니다.",
  },
  {
    href: "/study/wrong-answers",
    Icon: IconSparkles,
    title: "AI 오답노트",
    desc: "틀린 문제만 자동으로 모아 반복 학습. 약점을 없애 점수를 빠르게 올립니다.",
  },
  {
    href: "/study/checklist",
    Icon: IconChecklist,
    title: "실기 체크리스트",
    desc: "위생 순서·기구 세팅을 단계별로 암기. 필기뿐 아니라 실기까지 빈틈없이 대비합니다.",
  },
  {
    href: "/dashboard",
    Icon: IconHome,
    title: "학습 대시보드",
    desc: "D-Day·정답률·과목별 진행률을 한눈에. 매일의 학습 흐름을 관리합니다.",
  },
  {
    href: "/guide",
    Icon: IconCalendar,
    title: "시험 안내",
    desc: "시험 일정·과목·합격 기준·FAQ를 정리. 무엇을 언제 준비할지 명확해집니다.",
  },
];

// 공용: 로그인 없이 누구나
const PUBLIC_MENU = [
  { href: "/textbook", Icon: IconFileText, label: "교과서" },
  { href: "/community", Icon: IconMessage, label: "커뮤니티" },
  { href: "/notice", Icon: IconBell, label: "공지사항" },
  { href: "/news", Icon: IconNewspaper, label: "뉴스" },
  { href: "/faq", Icon: IconHelp, label: "자주 묻는 질문" },
];

const TIMELINE = [
  { date: "2025.10", label: "문신사법 공포", done: true },
  { date: "2026", label: "시험 준비 기간 · 출제기준 마련", done: true },
  { date: "2027.10", label: "법 시행 · 면허제도 개시", done: false },
  { date: "2027 말", label: "첫 국가시험 시행 예정", done: false },
];

export default function Home() {
  const hydrated = useHydrated();
  const dday = hydrated ? daysUntilExam() : null;

  return (
    <div className="pt-2">
      {/* 히어로 */}
      <section className="py-10 lg:py-16 grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
        <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm font-medium text-muted">
            <span className="h-2 w-2 rounded-full bg-success" />
            2027 문신사 국가시험 대비
          </span>
          <h1 className="mt-6 text-4xl sm:text-5xl font-bold leading-[1.15]">
            합격까지 함께,
            <br />
            <span className="text-primary">문신패스</span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted max-w-xl mx-auto lg:mx-0">
            과목별 문제풀이부터 실전 모의고사, AI 오답노트까지.
            합격에 필요한 학습을 한 곳에서.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-on-primary hover:bg-primary-hover transition-colors"
            >
              지금 시작하기
              <IconArrowRight size={18} />
            </Link>
            <Link
              href="/news"
              className="inline-flex items-center justify-center rounded-full border border-border-strong bg-surface px-7 py-3.5 text-base font-semibold hover:bg-surface-2 transition-colors"
            >
              최신 소식 보기
            </Link>
          </div>
        </div>

        {/* D-Day 카드 */}
        <div className="rounded-3xl border border-border bg-surface shadow-[var(--shadow-pop)] p-7 lg:p-9">
          <p className="text-sm text-muted">첫 국가시험까지</p>
          <p className="tabular text-6xl lg:text-7xl font-bold text-primary leading-none mt-2">
            {dday !== null ? `D-${dday}` : "D-—"}
          </p>
          <p className="text-sm text-subtle mt-2">2027년 12월 시행 예정 기준</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-primary-soft p-4">
              <p className="tabular text-2xl font-bold text-primary">4</p>
              <p className="text-xs text-muted mt-0.5">출제 과목</p>
            </div>
            <div className="rounded-2xl bg-surface-2 p-4">
              <p className="tabular text-2xl font-bold">{QUESTIONS.length}</p>
              <p className="text-xs text-muted mt-0.5">수록 문항</p>
            </div>
          </div>
        </div>
      </section>

      {/* 공개 콘텐츠 메뉴 (히어로 바로 아래 · 로그인 없이) */}
      <section className="pb-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {PUBLIC_MENU.map(({ href, Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-2.5 px-3 py-3.5 rounded-2xl border border-border bg-surface hover:border-primary hover:shadow-[var(--shadow-pop)] transition-all"
            >
              <span className="grid place-items-center h-9 w-9 rounded-lg bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-on-primary">
                <Icon size={18} />
              </span>
              <span className="font-medium text-sm sm:text-base">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 개인화 기능 소개 (로그인 시 이용 가능) */}
      <section className="py-8">
        <h2 className="text-2xl font-bold">로그인하면 이런 학습이 가능합니다</h2>
        <p className="mt-2 text-muted">
          회원가입 후 아래 기능으로 약점을 줄이고 합격에 다가가세요.
        </p>

        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PERSONAL_FEATURES.map(({ href, Icon, title, desc }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col gap-3 p-6 rounded-2xl border border-border bg-surface hover:border-primary hover:shadow-[var(--shadow-pop)] transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="grid place-items-center h-12 w-12 rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-on-primary">
                  <Icon size={24} />
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-subtle">
                  <IconLock size={12} /> 로그인
                </span>
              </div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-[0.95rem] leading-relaxed text-muted">{desc}</p>
            </Link>
          ))}
        </div>

      </section>

      {/* 최신 뉴스 */}
      <section className="py-8">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-2xl font-bold">최신 뉴스</h2>
          <Link href="/news" className="text-sm text-primary font-medium hover:underline">
            전체 보기
          </Link>
        </div>
        <ul className="rounded-2xl border border-border bg-surface overflow-hidden divide-y divide-border">
          {NEWS.slice(0, 5).map((n) => (
            <li key={n.id}>
              <Link
                href="/news"
                className="flex items-start gap-4 px-5 py-4 hover:bg-surface-2 transition-colors"
              >
                <span className="grid place-items-center h-9 w-9 shrink-0 rounded-lg bg-primary-soft text-primary">
                  <IconNewspaper size={18} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{n.title}</p>
                  <p className="text-sm text-muted truncate mt-0.5">{n.summary}</p>
                </div>
                <span className="tabular text-xs text-subtle shrink-0 mt-0.5">{n.date}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 주요 일정 */}
      <section className="py-8">
        <h2 className="text-2xl font-bold mb-6">주요 일정</h2>
        <div className="rounded-2xl border border-border bg-surface p-6 lg:p-8">
          <ol className="relative border-l border-border ml-2 max-w-2xl">
            {TIMELINE.map((item) => (
              <li key={item.date} className="ml-6 pb-6 last:pb-0">
                <span
                  className={`absolute -left-[6px] mt-1.5 h-3 w-3 rounded-full ring-4 ring-surface ${
                    item.done ? "bg-border-strong" : "bg-primary"
                  }`}
                />
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-4">
                  <span className="tabular text-sm text-subtle w-20 shrink-0">{item.date}</span>
                  <span className={`text-base ${item.done ? "text-subtle" : "font-medium"}`}>
                    {item.label}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-border py-8 mt-2 text-center text-sm text-subtle">
        <p>문신패스 · 문신사 국가시험 학습 서비스</p>
        <div className="mt-2 flex items-center justify-center gap-3">
          <Link href="/legal/terms" className="hover:text-primary transition-colors">이용약관</Link>
          <span className="text-border-strong">·</span>
          <Link href="/legal/privacy" className="hover:text-primary transition-colors">개인정보처리방침</Link>
        </div>
        <p className="mt-2">© 2026 MuShinPass</p>
      </footer>
    </div>
  );
}
