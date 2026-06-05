// 사이트 기본 URL. 배포 시 .env 의 NEXT_PUBLIC_SITE_URL 로 실제 도메인을 지정하세요.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://munshinpass.com'
).replace(/\/$/, '')

export const SITE_NAME = '문신패스'
