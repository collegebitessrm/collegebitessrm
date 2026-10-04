-- Local Home Kitchen menu update (4 Oct 2026): new prices, 14 new dishes
-- (Double Egg rice / noodles, two more "(White)" styles, SP Boneless
-- Biryani, Chicken Kaju Manchurian, two KFC sections), one rename and five
-- dishes dropped. 72 dishes → 81. Past orders keep their names and prices
-- (order_items snapshots them; dish_id goes null on delete).

-- 1. Prices.
update public.dishes d
   set price = v.price
  from (values
    ('Chicken Fry Biryani',               240),
    ('Chicken Boneless Biryani',          240),
    ('Chicken Lollipop Biryani',          250),
    ('Mughlai Biryani',                   260),
    ('Veg Fried Rice',                     90),
    ('Egg Fried Rice (White)',            110),
    ('Chicken Fried Rice (White)',        130),
    ('Veg Noodles',                        90),
    ('Egg Noodles (White)',               110),
    ('Chicken Noodles (White)',           130),
    ('Veg Manchurian',                     90),
    ('Egg Manchurian',                    180),
    ('Paneer Manchurian',                 200),
    ('Mushroom Manchurian',               200),
    ('Kaju Mushroom Manchurian',          210),
    ('Kaju Egg Rice',                     140),
    ('Kaju Paneer Rice',                  160),
    ('Kaju Mushroom Rice',                160)
  ) as v(name, price),
  public.restaurants r
 where r.name = 'Local Home Kitchen'
   and d.restaurant_id = r.id
   and d.name = v.name;

-- 2. Rename: the menu now lists it as Kaju Paneer Majestic (same ₹220).
update public.dishes d
   set name = 'Kaju Paneer Majestic'
  from public.restaurants r
 where r.name = 'Local Home Kitchen'
   and d.restaurant_id = r.id
   and d.name = 'Paneer Majestic';

-- 3. Piece counts as notes (shown on the dish card).
update public.dishes d
   set note = '6 pcs'
  from public.restaurants r
 where r.name = 'Local Home Kitchen'
   and d.restaurant_id = r.id
   and d.name in ('Chicken Lollipop', 'KFC Chicken Lollipop');

-- 4. Dropped from the menu.
delete from public.dishes d
 using public.restaurants r
 where r.name = 'Local Home Kitchen'
   and d.restaurant_id = r.id
   and d.name in ('Chicken Manchurian Rice', 'Egg Manchurian Rice',
                  'Chicken Manchurian Noodles', 'Egg Manchurian Noodles',
                  'Pepper Chicken');

-- 5. Two new sections, after SP Specials.
insert into public.dish_categories (restaurant_id, name, sort_order)
select r.id, v.name, v.sort_order
  from (values ('KFC Veg Starters', 10), ('KFC Non-Veg Starters', 11)) as v(name, sort_order)
  join public.restaurants r on r.name = 'Local Home Kitchen';

-- KFC Chicken Lollipop moves from Chicken Starters to KFC Non-Veg Starters
-- (the new menu lists it there as "KFC Lollipop (6 pcs)").
update public.dishes d
   set category_id = c.id
  from public.restaurants r
  join public.dish_categories c on c.restaurant_id = r.id and c.name = 'KFC Non-Veg Starters'
 where r.name = 'Local Home Kitchen'
   and d.restaurant_id = r.id
   and d.name = 'KFC Chicken Lollipop';

-- 6. New dishes.
insert into public.dishes (restaurant_id, category_id, name, price, is_veg, note)
select r.id, c.id, v.name, v.price, v.is_veg, v.note
  from (values
    ('Biryanis',             'SP Boneless Biryani',                 260, false, 'New'),
    ('Rice',                 'Veg Manchurian Rice (White)',         120, true,  null),
    ('Rice',                 'Double Egg Fried Rice',               120, false, null),
    ('Rice',                 'Double Egg Fried Rice (White)',       130, false, null),
    ('Noodles',              'Veg Manchurian Noodles (White)',      120, true,  null),
    ('Noodles',              'Double Egg Noodles',                  120, false, null),
    ('Noodles',              'Double Egg Noodles (White)',          130, false, null),
    ('Chicken Starters',     'Chicken Kaju Manchurian',             220, false, null),
    ('KFC Veg Starters',     'KFC Paneer',                          200, true,  '6 pcs'),
    ('KFC Veg Starters',     'KFC French Fries',                    250, true,  '100 g'),
    ('KFC Veg Starters',     'KFC Ball',                            230, true,  '6 pcs'),
    ('KFC Non-Veg Starters', 'KFC Drum Chicken',                    300, false, '6 pcs'),
    ('KFC Non-Veg Starters', 'KFC Chicken Majestic',                300, false, '12 pcs'),
    ('KFC Non-Veg Starters', 'KFC Popcorn',                         300, false, null)
  ) as v(section, name, price, is_veg, note)
  join public.restaurants r on r.name = 'Local Home Kitchen'
  join public.dish_categories c on c.restaurant_id = r.id and c.name = v.section;
