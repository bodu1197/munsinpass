'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

export interface NavItem {
  href: string
  label: string
  icon: ReactNode
}

function useActiveHref(items: { href: string }[]) {
  const pathname = usePathname()
  let best = ''
  for (const it of items) {
    if (pathname === it.href || pathname.startsWith(it.href + '/')) {
      if (it.href.length > best.length) best = it.href
    }
  }
  return best
}

/** 데스크톱 헤더용 가로 텍스트 내비 */
export function TopNav({ items }: { items: { href: string; label: string }[] }) {
  const active = useActiveHref(items)
  return (
    <nav className="flex items-center gap-0.5">
      {items.map((it) => {
        const on = it.href === active
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={on ? 'page' : undefined}
            className={`px-3 py-2 rounded-lg text-[0.95rem] font-medium whitespace-nowrap transition-colors ${
              on
                ? 'bg-primary-soft text-primary'
                : 'text-muted hover:bg-surface-2 hover:text-foreground'
            }`}
          >
            {it.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function SideNav({ items }: { items: NavItem[] }) {
  const active = useActiveHref(items)
  return (
    <nav className="flex flex-col gap-1 sticky top-20">
      {items.map((it) => {
        const on = it.href === active
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={on ? 'page' : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[0.95rem] font-medium transition-colors ${
              on
                ? 'bg-primary-soft text-primary'
                : 'text-muted hover:bg-surface-2 hover:text-foreground'
            }`}
          >
            <span className="shrink-0">{it.icon}</span>
            <span>{it.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function BottomNav({ items }: { items: NavItem[] }) {
  const active = useActiveHref(items)
  return (
    <div
      className="grid h-16"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((it) => {
        const on = it.href === active
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={on ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              on ? 'text-primary' : 'text-subtle hover:text-foreground'
            }`}
          >
            <span className="shrink-0">{it.icon}</span>
            <span className="text-[10.5px] font-medium leading-none">{it.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
