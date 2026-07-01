-- 미승인(draft) 뉴스 만료 삭제 쿼리(status='draft' AND created_at < 기준일) 인덱스.
-- 기존 news_items_status_pub_idx(status, published_at)는 draft 행엔 published_at 이 없어(null) 이 조회에 쓰이지 않는다.

create index if not exists news_items_status_created_idx
  on public.news_items (status, created_at);
