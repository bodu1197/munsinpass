'use client'

// 일일 학습 목표(문제 수) — 기기별 localStorage.
import { useSyncExternalStore } from 'react'

const KEY = 'munshinpass:goal:v1'
const EVENT = 'munshinpass:goal-change'
const DEFAULT = 20 // 일일 기본 목표(문항)
const MIN = 5 // 지속 가능한 최소
const MAX = 200 // 번아웃 방지 상한

function isBrowser() {
  return typeof window !== 'undefined'
}

function clamp(n: number) {
  return Math.max(MIN, Math.min(MAX, Math.round(n)))
}

export function getGoal(): number {
  if (!isBrowser()) return DEFAULT
  try {
    const v = parseInt(window.localStorage.getItem(KEY) ?? '', 10)
    return Number.isFinite(v) && v > 0 ? clamp(v) : DEFAULT
  } catch {
    return DEFAULT
  }
}

export function setGoal(n: number) {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(KEY, String(clamp(n)))
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

export function useGoal(): number {
  return useSyncExternalStore(subscribe, getGoal, () => DEFAULT)
}
