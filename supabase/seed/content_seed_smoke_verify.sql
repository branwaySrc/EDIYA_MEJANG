-- Smoke seed verification queries.

select
  count(*) as smoke_recipe_count
from public.recipes
where id = 'smoke-americano';

select
  recipe_id,
  jsonb_array_length(hero_visuals) as hero_visual_count,
  jsonb_array_length(steps) as step_count,
  jsonb_array_length(store_serving) as store_serving_count,
  jsonb_array_length(packaging) as packaging_count,
  jsonb_array_length(delivery) as delivery_count
from public.recipe_details
where recipe_id = 'smoke-americano';

select
  id,
  recipe_id,
  kind,
  status,
  title
from public.find_entries
where id = 'smoke-americano-pos';

select
  entry_id,
  count(*) as keyword_count
from public.find_entry_keywords
where entry_id = 'smoke-americano-pos'
group by entry_id;
