'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  IconHome,
  IconUsers,
  IconCreditCard,
  IconNewspaper,
  IconBell,
  IconFileText,
  IconClock,
  IconChart,
} from '@/components/icons'

const ITEMS = [
  { href: '/admin', label: '대시보드', Icon: IconHome },
  { href: '/admin/members', label: '회원', Icon: IconUsers },
  { href: '/admin/payments', label: '결제·이용권', Icon: IconCreditCard },
  { href: '/admin/news', label: '뉴스 검토', Icon: IconNewspaper },
  { href: '/admin/notices', label: '공지', Icon: IconBell },
  { href: '/admin/content', label: '콘텐츠', Icon: IconFileText },
  { href: '/admin/audit', label: '감사 로그', Icon: IconClock },
  { href: '/admin/stats', label: '통계', Icon: IconChart },
] as const

export function AdminNav() {
  const pathname = usePathname()
  return (
    <nav className="md:w-44 md:shrink-0 mb-4 md:mb-0" aria-label="관리자 메뉴">
      <p className="text-xs font-bold text-subtle px-2 mb-2 hidden md:block">최고 관리자</p>
      <ul className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1 -mx-1 px-1">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-primary text-on-primary font-semibold'
                    : 'text-muted hover:bg-surface-2 hover:text-foreground'
                }`}
              >
                <Icon size={17} />
                <span>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
