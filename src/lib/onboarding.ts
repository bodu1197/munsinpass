'use client'

// 온보딩 완료 여부 — 기기별 localStorage 플래그.
import { useSyncExternalStore } from 'react'

const KEY = 'munshinpass:onboarded:v1'
const EVENT = 'munshinpass:onboarded-change'

function isBrowser() {
  return typeof window !== 'undefined'
}

export function isOnboarded(): boolean {
  if (!isBrowser()) return true // SSR 에서는 배너를 숨김
  try {
    return window.localStorage.getItem(KEY) === '1'
  } catch {
    return true
  }
}

export function setOnboarded() {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(KEY, '1')
    window.dispatchEvent(new CustomEvent(EVENT))
  } catch {
    // 무시
  }
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener(EVENT, cb)
    window.removeEventListener('storage', cb)
  }
}

export function useOnboarded(): boolean {
  return useSyncExternalStore(subscribe, isOnboarded, () => true)
}
