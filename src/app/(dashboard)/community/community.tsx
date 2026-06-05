'use client'

import { useState } from 'react'
import { useHydrated } from '@/lib/progress'
import { IconPencil, IconX } from '@/components/icons'

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-2 text-[0.95rem] text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'

const STORAGE_KEY = 'munshinpass:community:v1'

interface Post {
  id: string
  nick: string
  title: string
  body: string
  at: number
}

const SEED: Post[] = [
  {
    id: 'seed-1',
    nick: '운영팀',
    title: '문신패스 커뮤니티에 오신 것을 환영합니다 🎉',
    body: '시험 정보, 학습 팁, 궁금한 점을 자유롭게 나눠주세요. 서로 존중하는 분위기를 부탁드립니다.',
    at: new Date('2026-06-01T09:00:00').getTime(),
  },
  {
    id: 'seed-2',
    nick: '수험생A',
    title: '위생·감염 과목 멸균 파트 정리 공유',
    body: '오토클레이브 121℃/15~20분, 손상성 폐기물은 전용 용기! 오답노트로 반복하니 확실히 외워지네요.',
    at: new Date('2026-06-03T14:30:00').getTime(),
  },
]

function timeAgo(ts: number) {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return '방금'
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}일 전`
  const d = new Date(ts)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
    d.getDate()
  ).padStart(2, '0')}`
}

function makeId() {
  return `${Date.now()}-${Math.floor(Math.random() * 1e6)}`
}

function loadPosts(): Post[] {
  if (typeof window === 'undefined') return SEED
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Post[]
  } catch {
    /* ignore */
  }
  return SEED
}

export function Community() {
  const hydrated = useHydrated()
  const [posts, setPosts] = useState<Post[]>(loadPosts)
  const [open, setOpen] = useState(false)
  const [nick, setNick] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  function persist(next: Post[]) {
    setPosts(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }

  function submit() {
    if (!title.trim() || !body.trim()) return
    const post: Post = {
      id: makeId(),
      nick: nick.trim() || '익명',
      title: title.trim(),
      body: body.trim(),
      at: Date.now(),
    }
    persist([post, ...posts])
    setTitle('')
    setBody('')
    setOpen(false)
  }

  function remove(id: string) {
    persist(posts.filter((p) => p.id !== id))
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[11px] text-subtle leading-relaxed">
          ※ 글은 현재 이 기기에 저장됩니다(로컬). 서버 동기화는 준비 중입니다.
        </p>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-sm font-semibold transition-colors cursor-pointer"
        >
          {open ? <IconX size={15} /> : <IconPencil size={15} />}
          {open ? '닫기' : '글쓰기'}
        </button>
      </div>

      {open && (
        <div className="mb-5 rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] p-4 space-y-3">
          <input
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            placeholder="닉네임 (선택, 기본 '익명')"
            className={inputClass}
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목"
            className={inputClass}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="내용을 입력하세요"
            rows={4}
            className={`${inputClass} resize-none`}
          />
          <button
            type="button"
            onClick={submit}
            disabled={!title.trim() || !body.trim()}
            className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-40 text-on-primary text-sm font-semibold transition-colors cursor-pointer disabled:cursor-default"
          >
            등록
          </button>
        </div>
      )}

      {!hydrated ? (
        <div className="h-32 animate-pulse rounded-2xl bg-surface-2" />
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-10 text-center text-sm text-muted">
          아직 게시글이 없습니다. 첫 글을 남겨보세요!
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((p) => (
            <li key={p.id} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-[0.95rem]">{p.title}</h3>
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  aria-label="삭제"
                  className="shrink-0 text-subtle hover:text-danger transition-colors cursor-pointer"
                >
                  <IconX size={15} />
                </button>
              </div>
              <p className="mt-1.5 text-[0.95rem] text-muted whitespace-pre-wrap leading-relaxed">
                {p.body}
              </p>
              <p className="mt-2.5 text-xs text-subtle">
                {p.nick} · {timeAgo(p.at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
