import { StudyNav } from './study-nav'

// 학습 영역 공용 레이아웃 — 모든 /study/* 페이지 상단에 뒤로/학습 홈 내비를 일괄 제공.
export default function StudyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StudyNav />
      {children}
    </>
  )
}
