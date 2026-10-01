-- Dishes a student has hearted on a menu. Private to the student: no
-- like counts are shown to anyone, admins included. One row per student
-- per dish (the primary key), so a student can heart each dish once and
-- the table can never hold more than students × dishes rows.
create table public.favorite_dishes (
  user_id    uuid not null references public.users (id) on delete cascade,
  dish_id    uuid not null references public.dishes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, dish_id)
);

-- Profile's "Liked dishes" row, newest first.
create index favorite_dishes_user_created_idx
  on public.favorite_dishes (user_id, created_at desc);
-- Index the dish foreign key (a dish deleted from a menu cascades here).
create index favorite_dishes_dish_idx on public.favorite_dishes (dish_id);

alter table public.favorite_dishes enable row level security;

-- A student sees, adds and removes only their own hearts. No update policy
-- (a heart is on or off, nothing to edit).
create policy "Students read own favourite dishes"
  on public.favorite_dishes for select
  to authenticated
  using (user_id = auth.uid());

create policy "Students add own favourite dishes"
  on public.favorite_dishes for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Students remove own favourite dishes"
  on public.favorite_dishes for delete
  to authenticated
  using (user_id = auth.uid());
