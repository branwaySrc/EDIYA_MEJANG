-- Minimal smoke seed for verifying Supabase source-content writes.
-- Run this before large seed batches.

begin;

insert into public.recipes (
  id,
  name,
  category,
  sub_category,
  chosung,
  status,
  sort_order,
  created_at,
  updated_at
) values (
  'smoke-americano',
  'SMOKE Americano',
  '음료',
  '커피',
  'SMOKEAMERICANO',
  'published',
  0,
  now(),
  now()
) on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  sub_category = excluded.sub_category,
  chosung = excluded.chosung,
  status = excluded.status,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.recipe_details (
  recipe_id,
  hero_visuals,
  steps,
  store_serving,
  packaging,
  delivery,
  created_at,
  updated_at
) values (
  'smoke-americano',
  jsonb_build_array(
    jsonb_build_object(
      'id', 'smoke-americano-hero',
      'title', '완성 이미지',
      'description', 'Supabase smoke test image slot'
    )
  ),
  jsonb_build_array(
    jsonb_build_object(
      'id', 'smoke-americano-step-1',
      'title', '1. 테스트 제조',
      'details', jsonb_build_array('샷을 준비합니다.', '물을 채웁니다.'),
      'visuals', jsonb_build_array(
        jsonb_build_object(
          'id', 'smoke-americano-step-1-visual',
          'title', '테스트 이미지',
          'description', 'Smoke test visual slot'
        )
      )
    )
  ),
  jsonb_build_array(
    jsonb_build_object(
      'id', 'smoke-americano-store',
      'title', '매장',
      'description', '매장 제공 테스트'
    )
  ),
  jsonb_build_array(
    jsonb_build_object(
      'id', 'smoke-americano-packaging',
      'title', '포장',
      'description', '포장 테스트'
    )
  ),
  jsonb_build_array(
    jsonb_build_object(
      'id', 'smoke-americano-delivery',
      'title', '배달',
      'description', '배달 테스트'
    )
  ),
  now(),
  now()
) on conflict (recipe_id) do update set
  hero_visuals = excluded.hero_visuals,
  steps = excluded.steps,
  store_serving = excluded.store_serving,
  packaging = excluded.packaging,
  delivery = excluded.delivery,
  updated_at = now();

insert into public.find_entries (
  id,
  recipe_id,
  kind,
  title,
  summary,
  notes,
  chosung,
  status,
  sort_order,
  payload,
  created_at,
  updated_at
) values (
  'smoke-americano-pos',
  'smoke-americano',
  'pos',
  'SMOKE Americano POS',
  'Supabase smoke test POS entry',
  '테스트 완료 후 삭제해도 됩니다.',
  'SMOKEAMERICANOPOS',
  'published',
  0,
  jsonb_build_object(
    'id', 'smoke-americano-pos',
    'recipeId', 'smoke-americano',
    'kind', 'pos',
    'title', 'SMOKE Americano POS',
    'summary', 'Supabase smoke test POS entry',
    'keywords', jsonb_build_array('smoke', 'americano'),
    'screenName', '음료',
    'buttonLabel', 'SMOKE Americano',
    'posImages', jsonb_build_array(),
    'posPath', jsonb_build_array('메인', '음료', '커피'),
    'notes', '테스트 완료 후 삭제해도 됩니다.',
    'chosung', 'SMOKEAMERICANOPOS',
    'updatedAt', now()
  ),
  now(),
  now()
) on conflict (id) do update set
  recipe_id = excluded.recipe_id,
  kind = excluded.kind,
  title = excluded.title,
  summary = excluded.summary,
  notes = excluded.notes,
  chosung = excluded.chosung,
  status = excluded.status,
  sort_order = excluded.sort_order,
  payload = excluded.payload,
  updated_at = now();

delete from public.find_entry_keywords
where entry_id = 'smoke-americano-pos';

insert into public.find_entry_keywords (entry_id, keyword, sort_order)
values
  ('smoke-americano-pos', 'smoke', 0),
  ('smoke-americano-pos', 'americano', 1);

commit;
