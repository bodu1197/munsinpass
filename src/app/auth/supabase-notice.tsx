// Supabase 미설정 시 로그인/회원가입 페이지에 표시되는 안내 배너.
export function SupabaseNotice() {
  return (
    <div className="mb-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3">
      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
        미리보기(데모) 모드 — 로그인 비활성화
      </p>
      <p className="mt-1 text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
        이 서비스는 <b>회원가입 후 이용</b>이 원칙입니다. 로그인을 활성화하려면{' '}
        <code className="font-mono">.env.local</code> 에 Supabase 키를 입력하세요. 설정 전에는
        미리보기로 둘러볼 수 있습니다.
      </p>
    </div>
  )
}
