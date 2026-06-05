// 서비스 공지사항 (운영자 게시) — 정적 시드. 추후 CMS/DB 연동 가능.

export interface NoticeItem {
  id: string
  title: string
  date: string
  body: string
}

export const NOTICES: NoticeItem[] = [
  {
    id: 'notice-4',
    title: '실기 체크리스트 기능 추가',
    date: '2026.06.05',
    body: '위생 순서·기구 세팅을 단계별로 점검·암기할 수 있는 실기 체크리스트를 추가했습니다. 암기 모드로 순서를 가려 외워보세요.',
  },
  {
    id: 'notice-3',
    title: '예상문제 추가 및 해설 보강',
    date: '2026.06.04',
    body: '위생·법규·색소·해부 4개 과목의 예상문제를 추가하고 해설을 보강했습니다. 모든 문항은 학습용 예상문제이며 실제 시험과 다를 수 있습니다.',
  },
  {
    id: 'notice-2',
    title: '다크 모드 및 디자인 개편',
    date: '2026.06.03',
    body: '장시간 학습 시 눈의 피로를 줄이도록 가독성 중심으로 디자인을 개편하고 다크 모드를 지원합니다.',
  },
  {
    id: 'notice-1',
    title: '문신패스 베타 오픈',
    date: '2026.06.01',
    body: '2027년 문신사 국가시험 대비 학습 서비스 문신패스가 베타 오픈했습니다. 과목별 문제풀이와 실전 모의고사를 지금 이용해보세요.',
  },
]
