// 날짜 표시 포맷(로컬). 관리자·공개 페이지 공용 — 중복 제거.

function p(n: number): string {
  return String(n).padStart(2, '0')
}

/** YYYY.MM.DD */
export function fmtDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`
}

/** YYYY.MM.DD HH:mm */
export function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/** MM.DD HH:mm (조밀한 목록용) */
export function fmtDateTimeShort(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
