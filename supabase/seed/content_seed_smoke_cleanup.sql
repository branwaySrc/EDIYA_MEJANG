-- Removes only the smoke seed rows.

begin;

delete from public.find_entry_keywords
where entry_id = 'smoke-americano-pos';

delete from public.find_entries
where id = 'smoke-americano-pos';

delete from public.recipes
where id = 'smoke-americano';

commit;
