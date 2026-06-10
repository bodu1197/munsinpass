import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { isAdminRole, isAdminEmail } from './roles'

describe('isAdminRole (DB 역할)', () => {
  it('admin·superadmin 만 관리자', () => {
    expect(isAdminRole('admin')).toBe(true)
    expect(isAdminRole('superadmin')).toBe(true)
  })
  it('user·미지·빈값은 비관리자', () => {
    expect(isAdminRole('user')).toBe(false)
    expect(isAdminRole('moderator')).toBe(false)
    expect(isAdminRole('')).toBe(false)
    expect(isAdminRole(null)).toBe(false)
    expect(isAdminRole(undefined)).toBe(false)
  })
})

describe('isAdminEmail (ADMIN_EMAILS 부트스트랩)', () => {
  const orig = process.env.ADMIN_EMAILS
  beforeEach(() => {
    process.env.ADMIN_EMAILS = 'owner@x.com, Second@Y.com'
  })
  afterEach(() => {
    if (orig === undefined) delete process.env.ADMIN_EMAILS
    else process.env.ADMIN_EMAILS = orig
  })

  it('목록에 있으면 true(대소문자·공백 무시)', () => {
    expect(isAdminEmail('owner@x.com')).toBe(true)
    expect(isAdminEmail('OWNER@X.COM')).toBe(true)
    expect(isAdminEmail('  second@y.com  ')).toBe(true)
  })
  it('목록에 없으면 false', () => {
    expect(isAdminEmail('nobody@x.com')).toBe(false)
  })
  it('null·undefined·빈값은 false', () => {
    expect(isAdminEmail(null)).toBe(false)
    expect(isAdminEmail(undefined)).toBe(false)
    expect(isAdminEmail('')).toBe(false)
  })
  it('ADMIN_EMAILS 미설정 시 항상 false', () => {
    delete process.env.ADMIN_EMAILS
    expect(isAdminEmail('owner@x.com')).toBe(false)
  })
})
