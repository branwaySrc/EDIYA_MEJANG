# 선불 고객 연락처 및 정보 변경 이력 적용 프롬프트

현재 EDIYA_MEJANG 앱의 유료 고객 데이터 구조를 먼저 검사한 뒤, 아래 요구사항을 멱등적으로 적용해 주세요. 기존 데이터 삭제, 원장 수정, RLS 약화는 금지합니다.

## 기존 구조 주의사항

- `public.paid_customers.phone` 컬럼은 이미 존재합니다. 중복 생성하지 말고 그대로 사용하세요.
- 금액 변동 이력은 `public.paid_ledger_entries`에 저장합니다.
- 고객 정보 변경은 금액 변동이 아니므로 `paid_ledger_entries`에 넣지 마세요.
- 현재 앱은 `store_id = 'wolpi'`인 단일 매장 trusted-client 모델입니다.
- 현재 Supabase Auth 역할만으로 사장/직원을 구분할 수 없으므로 RLS가 사장 전용 권한을 완벽하게 보장한다고 설명하지 마세요.

## 1. 고객 정보 변경 이력 테이블

`public.paid_customer_profile_changes` 테이블을 멱등적으로 생성해 주세요.

컬럼:

- `id text primary key default gen_random_uuid()::text`
- `store_id text not null default 'wolpi'`
- `customer_id text not null references public.paid_customers(id) on delete cascade`
- `before_name text not null`
- `before_nickname text not null`
- `before_affiliation text not null`
- `before_phone text null`
- `after_name text not null`
- `after_nickname text not null`
- `after_affiliation text not null`
- `after_phone text null`
- `changed_fields text[] not null`
- `changed_by text null`
- `occurred_at timestamptz not null default now()`
- `created_at timestamptz not null default now()`

제약조건:

- `changed_fields`는 비어 있을 수 없습니다.
- `changed_fields`의 값은 `name`, `nickname`, `affiliation`, `phone` 중 하나만 허용합니다.
- 이름, 별칭, 소속은 trim 후 빈 문자열을 허용하지 않습니다.
- 연락처는 null 또는 숫자 10~11자리만 저장되도록 RPC에서 정규화 및 검증합니다.

인덱스:

- `(customer_id, occurred_at desc)`
- `(store_id, occurred_at desc)`
- `customer_id` FK 조회가 인덱스를 사용하도록 확인하세요.

## 2. RLS 및 권한

- `paid_customer_profile_changes`에 RLS를 활성화하세요.
- 현재 trusted-client 모델에 맞춰 `store_id = 'wolpi'` 행에 대해서만 anon/authenticated SELECT, INSERT가 가능하도록 정책을 작성하세요.
- 이력 테이블에는 anon/authenticated UPDATE, DELETE 권한과 정책을 주지 마세요.
- public 역할에는 불필요한 권한을 주지 마세요.
- 기존 `paid_customers` 및 `paid_ledger_entries`의 RLS, 정책, GRANT를 약화하거나 제거하지 마세요.
- `security definer`로 권한을 우회하지 마세요.

## 3. 원자적 고객 정보 변경 RPC

`public.update_paid_customer_profile` 함수를 `security invoker`로 생성해 주세요.

입력 파라미터:

- `p_customer_id text`
- `p_store_id text`
- `p_name text`
- `p_nickname text`
- `p_affiliation text`
- `p_phone text default null`
- `p_change_id text default null`
- `p_changed_by text default null`
- `p_occurred_at timestamptz default now()`

동작:

- 이름, 별칭, 소속을 trim하고 빈 문자열이면 예외 처리합니다.
- 연락처는 숫자만 남겨 저장하고 값이 있으면 10~11자리인지 검사합니다. 빈 값은 null로 저장합니다.
- `p_store_id`에 속하며 active 상태인 고객을 `SELECT ... FOR UPDATE`로 잠급니다.
- 기존 값과 새 값을 `IS DISTINCT FROM`으로 비교해 `changed_fields` 배열을 만듭니다.
- 변경점이 없으면 업데이트나 로그 삽입 없이 `{"customer": 현재 고객 row, "change_log": null}` JSONB를 반환합니다.
- 변경점이 있으면 동일 트랜잭션 안에서 고객의 `name`, `nickname`, `affiliation`, `phone`을 업데이트하고, 변경 전후 스냅샷과 `changed_fields`를 변경 이력에 INSERT합니다.
- 변경 성공 시 `{"customer": 업데이트된 고객 row, "change_log": 생성된 변경 이력 row}` JSONB를 반환합니다.
- `p_change_id`가 전달되면 해당 값을 이력 ID로 사용하세요. 같은 `p_change_id`가 이미 존재하는 재시도 요청은 중복 행이나 unique 오류를 만들지 말고, 기존 결과를 반환하는 멱등 동작으로 처리하세요.
- `paid_customers`의 기존 `updated_at` 및 `search_text` 갱신 트리거가 있다면 그대로 작동하게 하세요.
- `paid_ledger_entries`와 `current_balance`는 절대 변경하지 마세요.
- 함수 실행 권한은 anon/authenticated에 명시적으로 부여하고 public에서는 회수하세요.

## 4. 최종 처리 및 검증

- `notify pgrst, 'reload schema';`를 실행하세요.
- 기존 `paid_customers`, `paid_ledger_entries` 행 수와 금액 및 잔액이 변경되지 않았는지 확인하세요.
- 새 테이블, 제약조건, 인덱스, 함수 시그니처, RLS 정책, GRANT 상태를 정리해 주세요.
- 가능하면 테스트 트랜잭션 안에서 고객 수정과 이력 생성이 함께 성공하거나 함께 실패하는지 확인하고 ROLLBACK하세요.
- 실제 데이터 삭제는 하지 마세요.
