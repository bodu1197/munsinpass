import type { Metadata } from 'next'
import { MockExam } from './mock-exam'

export const metadata: Metadata = {
  title: '실전 모의고사 | 문신패스',
  description: '제한 시간 안에 전 과목 문제를 풀고 성적을 확인하세요.',
}

export default function MockExamPage() {
  return <MockExam />
}
