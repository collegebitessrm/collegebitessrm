-- Clg Bites Biryani Nation menu update (1 Oct 2026, second list): new
-- biryani prices, Chicken Fry ₹230, a Half portion of Chicken Dum Biryani,
-- and a Fried Rice section. Past orders keep their prices.

update public.dishes d
   set price = v.price
  from (values
    ('Chicken Dum Biryani (Single)',          200), ('Chicken Dum Biryani (Full)',          290),
    ('Chicken Fry Biryani (Single)',          210), ('Chicken Fry Biryani (Full)',          300),
    ('Chicken Boneless Biryani (Single)',     230), ('Chicken Boneless Biryani (Full)',     330),
    ('Chicken Lollipop Biryani (Single)',     250), ('Chicken Lollipop Biryani (Full)',     360),
    ('Chicken Moghalai Biryani (Single)',     250), ('Chicken Moghalai Biryani (Full)',     360),
    ('Chicken 65 Biryani (Single)',           230), ('Chicken 65 Biryani (Full)',           330),
    ('All Mix Chicken Biryani (Single)',      240), ('All Mix Chicken Biryani (Full)',      340),
    ('Egg Biryani (Single)',                  180), ('Egg Biryani (Full)',                  270),
    ('Veg Dum Biryani (Single)',              160), ('Veg Dum Biryani (Full)',              260),
    ('Paneer Biryani (Single)',               230), ('Paneer Biryani (Full)',               330),
    ('Cashew Biryani (Single)',               240), ('Cashew Biryani (Full)',               340),
    ('Cashew Paneer Mixed Biryani (Single)',  240), ('Cashew Paneer Mixed Biryani (Full)',  340),
    ('Chicken Fry',                           230)
  ) as v(name, price),
  public.restaurants r
 where r.name = 'Clg Bites Biryani Nation'
   and d.restaurant_id = r.id
   and d.name = v.name;

-- Half portion, first in the Chicken Biryani section (sort -1).
insert into public.dishes (restaurant_id, category_id, name, price, is_veg, note, sort_order)
select r.id, c.id, 'Chicken Dum Biryani (Half)', 170, false, '7x9 cover', -1
  from public.restaurants r
  join public.dish_categories c on c.restaurant_id = r.id and c.name = 'Chicken Biryani'
 where r.name = 'Clg Bites Biryani Nation';

-- Fried Rice section, after Chinese.
insert into public.dish_categories (restaurant_id, name, sort_order)
select r.id, 'Fried Rice', 4 from public.restaurants r where r.name = 'Clg Bites Biryani Nation';

insert into public.dishes (restaurant_id, category_id, name, price, is_veg, sort_order)
select r.id, c.id, v.name, v.price, true, v.sort_order
  from (values ('Paneer Fried Rice', 140, 0), ('Kaju Fried Rice', 150, 1)) as v(name, price, sort_order)
  join public.restaurants r on r.name = 'Clg Bites Biryani Nation'
  join public.dish_categories c on c.restaurant_id = r.id and c.name = 'Fried Rice';
