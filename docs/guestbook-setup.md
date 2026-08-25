# 끌림 온라인 방명록 설정

`/exhibitions/2026-2-attraction/`의 방명록은 Vercel 함수 `/api/guestbook`을 통해 Supabase REST API에 연결됩니다. 설정 전에는 페이지가 깨지지 않고 `온라인 방명록 기능을 준비하고 있습니다.` 안내만 표시됩니다.

## Vercel 환경변수

Production, Preview, Development 환경에 다음 값을 설정합니다.

- `SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_ANON_KEY`: Supabase 프로젝트 anon key

기존 Vite 명명 규칙을 쓰는 환경을 위해 아래 이름도 호환됩니다.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

동일한 값이 두 이름에 모두 있으면 `SUPABASE_*` 값을 우선 사용합니다. service role key는 사용하지 않습니다.

## 테이블 준비

Supabase SQL Editor에서 `docs/supabase-guestbook.sql`을 한 번 실행합니다. 테이블은 익명 사용자에게 목록 조회와 새 메시지 등록만 허용하며 수정과 삭제는 허용하지 않습니다.

환경변수와 테이블을 설정한 뒤 Vercel을 다시 배포하면 입력 폼과 최신순 메시지 목록이 자동으로 활성화됩니다.
