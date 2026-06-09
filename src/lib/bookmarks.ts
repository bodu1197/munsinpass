'use client'

// 문제 북마크/즐겨찾기 — 진도(progress.ts)와 동일한 localStorage + useSyncExternalStore 패턴.
// 북마크된 문제 ID 배열(최신 추가가 앞)을 저장한다.

import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'munshinpass:bookmarks:v1'
const EVENT = 'munshinpass:bookmarks-change'

function isBrowser() {
  return typeof window !== 'undefined'
}

function read(): string[] {
  if (!isBrowser()) return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

function write(ids: string[]) {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    window.dispatchEvent(new CustomEvent(EVENT))
  } catch {
    // 저장 실패는 조용히 무시
  }
}

export function getBookmarks(): string[] {
  return read()
}

/** 북마크 토글. 토글 후 상태(true=북마크됨) 반환 */
export function toggleBookmark(id: string): boolean {
  const ids = read()
  const i = ids.indexOf(id)
  if (i >= 0) {
    ids.splice(i, 1)
    write(ids)
    return false
  }
  ids.unshift(id)
  write(ids)
  return true
}

export function removeBookmark(id: string) {
  write(read().filter((x) => x !== id))
}

// ── 구독(useSyncExternalStore) — 참조 안정성 유지 ──
const EMPTY: string[] = []
let cachedRaw: string | null = null
let cachedIds: string[] = EMPTY

function snapshot(): string[] {
  if (!isBrowser()) return EMPTY
  const raw = window.localStorage.getItem(STORAGE_KEY) ?? ''
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedIds = read()
  }
  return cachedIds
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener(EVENT, cb)
    window.removeEventListener('storage', cb)
  }
}

export function useBookmarks(): string[] {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY)
}

export function useIsBookmarked(id: string): boolean {
  const ids = useSyncExternalStore(subscribe, snapshot, () => EMPTY)
  return ids.includes(id)
}
