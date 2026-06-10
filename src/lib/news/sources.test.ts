import { describe, it, expect } from 'vitest'
import { classifySource, isRelevant } from './sources'

describe('classifySource (출처 신뢰 화이트리스트)', () => {
  it('정부·공공은 Tier 1', () => {
    expect(classifySource('korea.kr')?.tier).toBe(1)
    expect(classifySource('www.mohw.go.kr')?.tier).toBe(1)
  })
  it('주요 언론은 Tier 2 (서브도메인 매칭)', () => {
    expect(classifySource('yna.co.kr')?.tier).toBe(2)
    expect(classifySource('imnews.imbc.com')?.tier).toBe(2)
  })
  it('화이트리스트 밖·아그리게이터는 null(폐기)', () => {
    expect(classifySource('some-blog.tistory.com')).toBeNull()
    expect(classifySource('v.daum.net')).toBeNull()
  })
})

describe('isRelevant (관련성 필터)', () => {
  it('문신사법/시험 관련은 통과', () => {
    expect(isRelevant('문신사법 국가시험 2027년 시행', '')).toBe(true)
    expect(isRelevant('비의료인 문신 시술 합법화', '대법원 판결')).toBe(true)
  })
  it('주제어(문신/타투) 없으면 탈락', () => {
    expect(isRelevant('오늘의 날씨 맑음', '기온 20도')).toBe(false)
  })
  it('맥락어 없으면 탈락', () => {
    expect(isRelevant('타투 디자인 갤러리', '예쁜 그림')).toBe(false)
  })
  it('제거/광고성은 부정필터로 탈락', () => {
    expect(isRelevant('문신 제거 시술 이벤트', '레이저 제거')).toBe(false)
  })
})
