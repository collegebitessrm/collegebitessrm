-- Clg Bites Biryani Nation, 1 Oct 2026: new prices on all 24 biryanis
-- (Single +₹20, Full +₹40) and two new sections, Starters (9) and
-- Chinese (4). Past orders keep their old prices (order_items snapshots).

-- 1. New prices, matched by exact dish name within this restaurant.
update public.dishes d
   set price = v.price
  from (values
    ('Chicken Dum Biryani (Single)',          220), ('Chicken Dum Biryani (Full)',          310),
    ('Chicken Fry Biryani (Single)',          230), ('Chicken Fry Biryani (Full)',          320),
    ('Chicken Boneless Biryani (Single)',     240), ('Chicken Boneless Biryani (Full)',     340),
    ('Chicken Lollipop Biryani (Single)',     240), ('Chicken Lollipop Biryani (Full)',     340),
    ('Chicken Moghalai Biryani (Single)',     250), ('Chicken Moghalai Biryani (Full)',     350),
    ('Chicken 65 Biryani (Single)',           240), ('Chicken 65 Biryani (Full)',           340),
    ('All Mix Chicken Biryani (Single)',      240), ('All Mix Chicken Biryani (Full)',      330),
    ('Egg Biryani (Single)',                  200), ('Egg Biryani (Full)',                  280),
    ('Veg Dum Biryani (Single)',              180), ('Veg Dum Biryani (Full)',              270),
    ('Paneer Biryani (Single)',               240), ('Paneer Biryani (Full)',               340),
    ('Cashew Biryani (Single)',               250), ('Cashew Biryani (Full)',               350),
    ('Cashew Paneer Mixed Biryani (Single)',  270), ('Cashew Paneer Mixed Biryani (Full)',  350)
  ) as v(name, price),
  public.restaurants r
 where r.name = 'Clg Bites Biryani Nation'
   and d.restaurant_id = r.id
   and d.name = v.name;

-- 2. Two new sections after the biryanis.
insert into public.dish_categories (restaurant_id, name, sort_order)
select r.id, v.name, v.sort_order
  from (values ('Starters', 2), ('Chinese', 3)) as v(name, sort_order)
  join public.restaurants r on r.name = 'Clg Bites Biryani Nation';

-- 3. The new dishes (values first, restaurant + section joined by name).
insert into public.dishes (restaurant_id, category_id, name, price, is_veg, sort_order)
select r.id, c.id, v.name, v.price, v.is_veg, v.sort_order
  from (values
    ('Starters', 'Chicken 65',          240, false, 0),
    ('Starters', 'Chilli Chicken',      240, false, 1),
    ('Starters', 'Dragon Chicken',      250, false, 2),
    ('Starters', 'Chicken Manchurian',  250, false, 3),
    ('Starters', 'Chicken Fry',         250, false, 4),
    ('Starters', 'Crispy Chicken',      250, false, 5),
    ('Starters', 'Chicken Lollipop',    260, false, 6),
    ('Starters', 'Veg Manchurian',      190, true,  7),
    ('Starters', 'Gobi Manchurian',     210, true,  8),
    ('Chinese',  'Veg Fried Rice',      110, true,  0),
    ('Chinese',  'Egg Fried Rice',      110, false, 1),
    ('Chinese',  'Chicken Fried Rice',  130, false, 2),
    ('Chinese',  'Noodles',             110, true,  3)
  ) as v(category, name, price, is_veg, sort_order)
  join public.restaurants r on r.name = 'Clg Bites Biryani Nation'
  join public.dish_categories c on c.restaurant_id = r.id and c.name = v.category;

-- 4. It serves Chinese now too, so search and its card chips show it.
update public.restaurants
   set cuisine_tags = array['Biryani', 'Chinese']
 where name = 'Clg Bites Biryani Nation';
