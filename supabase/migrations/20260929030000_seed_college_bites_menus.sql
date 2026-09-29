-- Data only — College Bites' three partner restaurants and their menus
-- (137 dishes). Photos are matched by name in src/lib/data/dish-photos.ts,
-- not stored here. Biryani Nation promises delivery within an hour; the
-- other two use the 40-minute default (restaurants.delivery_minutes).
--
-- Menu clean-ups agreed with the client: Egg Manchurian is non-veg even
-- though it was listed under veg starters; "Tameto" → "Tomato";
-- "Manchuria" → "Manchurian" everywhere; Biryani Nation's Single / Full
-- sizes are separate dishes.
--
-- Shape: each values list comes first and the restaurant / section are
-- joined onto it by name.

-- 1. Restaurants -----------------------------------------------------------
insert into public.restaurants (name, phone, description, cuisine_tags, is_active, delivery_minutes)
values
  ('Triangle Food Court',      '+919989955833', 'Kuragallu',  array['Chinese', 'Biryani'], true, 40),
  ('Local Home Kitchen',       '+919989955833', 'Neerukonda', array['Biryani', 'Chinese'], true, 40),
  ('Clg Bites Biryani Nation', '+919989955833', null,         array['Biryani'],            true, 60);

-- 2. Sections --------------------------------------------------------------
insert into public.dish_categories (restaurant_id, name, sort_order)
select r.id, v.name, v.sort_order
  from (values
    ('Triangle Food Court', 'Veg Starters (500ml)',      0),
    ('Triangle Food Court', 'Veg Rice (750ml)',          1),
    ('Triangle Food Court', 'Veg Noodles (750ml)',       2),
    ('Triangle Food Court', 'Veg Biryani (1000ml)',      3),
    ('Triangle Food Court', 'Non-Veg Starters (500ml)',  4),
    ('Triangle Food Court', 'Non-Veg Rice (750ml)',      5),
    ('Triangle Food Court', 'Non-Veg Noodles (750ml)',   6),
    ('Triangle Food Court', 'Non-Veg Biryani (1000ml)',  7),

    ('Local Home Kitchen',  'Biryanis',                  0),
    ('Local Home Kitchen',  'Rice',                      1),
    ('Local Home Kitchen',  'Noodles',                   2),
    ('Local Home Kitchen',  'Veg Starters',              3),
    ('Local Home Kitchen',  'Chicken Starters',          4),
    ('Local Home Kitchen',  'Paneer Items',              5),
    ('Local Home Kitchen',  'Mushroom Items',            6),
    ('Local Home Kitchen',  'Schezwan Items',            7),
    ('Local Home Kitchen',  'Kaju Items',                8),
    ('Local Home Kitchen',  'SP Specials',               9),

    ('Clg Bites Biryani Nation', 'Chicken Biryani',      0),
    ('Clg Bites Biryani Nation', 'Veg Biryani',          1)
  ) as v (restaurant, name, sort_order)
  join public.restaurants r on r.name = v.restaurant;

-- 3. Dishes ----------------------------------------------------------------
insert into public.dishes (restaurant_id, category_id, name, price, is_veg, note, sort_order)
select r.id, c.id, v.name, v.price, v.is_veg, null, v.sort_order
  from (values
    -- Triangle Food Court ------------------------------------------------
    ('Triangle Food Court', 'Veg Starters (500ml)', 'Veg Manchurian',            120, true,  0),
    ('Triangle Food Court', 'Veg Starters (500ml)', 'Paneer Manchurian',         190, true,  1),
    ('Triangle Food Court', 'Veg Starters (500ml)', 'Mushroom Manchurian',       200, true,  2),
    ('Triangle Food Court', 'Veg Starters (500ml)', 'Baby Corn Manchurian',      190, true,  3),

    ('Triangle Food Court', 'Veg Rice (750ml)', 'Vegetable Fried Rice',          120, true,  0),
    ('Triangle Food Court', 'Veg Rice (750ml)', 'Paneer Fried Rice',             170, true,  1),
    ('Triangle Food Court', 'Veg Rice (750ml)', 'Baby Corn Fried Rice',          160, true,  2),
    ('Triangle Food Court', 'Veg Rice (750ml)', 'Corn Fried Rice',               140, true,  3),
    ('Triangle Food Court', 'Veg Rice (750ml)', 'Tomato Fried Rice',             140, true,  4),
    ('Triangle Food Court', 'Veg Rice (750ml)', 'Zeera Fried Rice',              140, true,  5),
    ('Triangle Food Court', 'Veg Rice (750ml)', 'Veg Manchurian Fried Rice',     150, true,  6),

    ('Triangle Food Court', 'Veg Noodles (750ml)', 'Vegetable Noodles',          120, true,  0),
    ('Triangle Food Court', 'Veg Noodles (750ml)', 'Veg Manchurian Noodles',     140, true,  1),
    ('Triangle Food Court', 'Veg Noodles (750ml)', 'SP Kaju Noodles',            170, true,  2),
    ('Triangle Food Court', 'Veg Noodles (750ml)', 'Paneer Noodles',             150, true,  3),
    ('Triangle Food Court', 'Veg Noodles (750ml)', 'Mushroom Noodles',           160, true,  4),

    ('Triangle Food Court', 'Veg Biryani (1000ml)', 'Cashew Biryani',            220, true,  0),
    ('Triangle Food Court', 'Veg Biryani (1000ml)', 'Paneer Biryani',            200, true,  1),
    ('Triangle Food Court', 'Veg Biryani (1000ml)', 'Mushroom Biryani',          200, true,  2),

    ('Triangle Food Court', 'Non-Veg Starters (500ml)', 'Chicken Manchurian',    200, false, 0),
    ('Triangle Food Court', 'Non-Veg Starters (500ml)', 'Chilli Chicken',        220, false, 1),
    ('Triangle Food Court', 'Non-Veg Starters (500ml)', 'Chicken 65',            200, false, 2),
    ('Triangle Food Court', 'Non-Veg Starters (500ml)', 'Pepper Chicken',        245, false, 3),
    ('Triangle Food Court', 'Non-Veg Starters (500ml)', 'Lemon Chicken',         245, false, 4),
    ('Triangle Food Court', 'Non-Veg Starters (500ml)', 'Majestic Chicken',      245, false, 5),
    ('Triangle Food Court', 'Non-Veg Starters (500ml)', 'Garlic Chicken',        245, false, 6),
    ('Triangle Food Court', 'Non-Veg Starters (500ml)', 'Chicken 555',           245, false, 7),

    ('Triangle Food Court', 'Non-Veg Rice (750ml)', 'Chicken Fried Rice',             140, false, 0),
    ('Triangle Food Court', 'Non-Veg Rice (750ml)', 'Chicken Manchurian Fried Rice',  170, false, 1),
    ('Triangle Food Court', 'Non-Veg Rice (750ml)', 'Egg Fried Rice (Double Egg)',    120, false, 2),
    ('Triangle Food Court', 'Non-Veg Rice (750ml)', 'Egg Manchurian Fried Rice',      140, false, 3),

    ('Triangle Food Court', 'Non-Veg Noodles (750ml)', 'Chicken Noodles',            150, false, 0),
    ('Triangle Food Court', 'Non-Veg Noodles (750ml)', 'Chicken Manchurian Noodles', 170, false, 1),
    ('Triangle Food Court', 'Non-Veg Noodles (750ml)', 'Egg Noodles',                140, false, 2),
    ('Triangle Food Court', 'Non-Veg Noodles (750ml)', 'Egg Manchurian Noodles',     160, false, 3),

    ('Triangle Food Court', 'Non-Veg Biryani (1000ml)', 'Chicken Dum Biryani',       180, false, 0),
    ('Triangle Food Court', 'Non-Veg Biryani (1000ml)', 'Chicken Fry Biryani',       200, false, 1),
    ('Triangle Food Court', 'Non-Veg Biryani (1000ml)', 'Chicken Curry Biryani',     200, false, 2),
    ('Triangle Food Court', 'Non-Veg Biryani (1000ml)', 'Egg Biryani',               150, false, 3),
    ('Triangle Food Court', 'Non-Veg Biryani (1000ml)', 'Gongura Chicken Biryani',   200, false, 4),
    ('Triangle Food Court', 'Non-Veg Biryani (1000ml)', 'Boneless Biryani',          270, false, 5),

    -- Local Home Kitchen -------------------------------------------------
    ('Local Home Kitchen', 'Biryanis', 'Chicken Dum Biryani',        170, false, 0),
    ('Local Home Kitchen', 'Biryanis', 'Chicken Fry Biryani',        190, false, 1),
    ('Local Home Kitchen', 'Biryanis', 'Chicken Boneless Biryani',   200, false, 2),
    ('Local Home Kitchen', 'Biryanis', 'Chicken 65 Biryani',         250, false, 3),
    ('Local Home Kitchen', 'Biryanis', 'Chicken Lollipop Biryani',   260, false, 4),
    ('Local Home Kitchen', 'Biryanis', 'Mughlai Biryani',            220, false, 5),
    ('Local Home Kitchen', 'Biryanis', 'Mushroom Biryani',           200, true,  6),
    ('Local Home Kitchen', 'Biryanis', 'Kaju Mushroom Biryani',      220, true,  7),
    ('Local Home Kitchen', 'Biryanis', 'Paneer Biryani',             200, true,  8),
    ('Local Home Kitchen', 'Biryanis', 'Kaju Paneer Biryani',        260, true,  9),

    ('Local Home Kitchen', 'Rice', 'Veg Fried Rice',                         80, true,  0),
    ('Local Home Kitchen', 'Rice', 'Veg Fried Rice (White)',                100, true,  1),
    ('Local Home Kitchen', 'Rice', 'Veg Manchurian Rice',                   110, true,  2),
    ('Local Home Kitchen', 'Rice', 'Egg Fried Rice',                        100, false, 3),
    ('Local Home Kitchen', 'Rice', 'Egg Fried Rice (White)',                120, false, 4),
    ('Local Home Kitchen', 'Rice', 'Egg Manchurian Rice',                   130, false, 5),
    ('Local Home Kitchen', 'Rice', 'Chicken Fried Rice',                    120, false, 6),
    ('Local Home Kitchen', 'Rice', 'Chicken Fried Rice (White)',            140, false, 7),
    ('Local Home Kitchen', 'Rice', 'Chicken Manchurian Rice',               150, false, 8),
    ('Local Home Kitchen', 'Rice', 'Double Egg Chicken Fried Rice',         130, false, 9),
    ('Local Home Kitchen', 'Rice', 'Double Egg Chicken Fried Rice (White)', 140, false, 10),

    ('Local Home Kitchen', 'Noodles', 'Veg Noodles',                         80, true,  0),
    ('Local Home Kitchen', 'Noodles', 'Veg Noodles (White)',                100, true,  1),
    ('Local Home Kitchen', 'Noodles', 'Veg Manchurian Noodles',             110, true,  2),
    ('Local Home Kitchen', 'Noodles', 'Egg Noodles',                        100, false, 3),
    ('Local Home Kitchen', 'Noodles', 'Egg Noodles (White)',                120, false, 4),
    ('Local Home Kitchen', 'Noodles', 'Egg Manchurian Noodles',             130, false, 5),
    ('Local Home Kitchen', 'Noodles', 'Chicken Noodles',                    120, false, 6),
    ('Local Home Kitchen', 'Noodles', 'Chicken Noodles (White)',            140, false, 7),
    ('Local Home Kitchen', 'Noodles', 'Chicken Manchurian Noodles',         150, false, 8),
    ('Local Home Kitchen', 'Noodles', 'Double Egg Chicken Noodles',         130, false, 9),
    ('Local Home Kitchen', 'Noodles', 'Double Egg Chicken Noodles (White)', 140, false, 10),

    ('Local Home Kitchen', 'Veg Starters', 'Veg Manchurian',            80, true,  0),
    ('Local Home Kitchen', 'Veg Starters', 'Egg Manchurian',           100, false, 1),
    ('Local Home Kitchen', 'Veg Starters', 'Paneer Manchurian',        180, true,  2),
    ('Local Home Kitchen', 'Veg Starters', 'Paneer Majestic',          220, true,  3),
    ('Local Home Kitchen', 'Veg Starters', 'Kaju Paneer Manchurian',   220, true,  4),
    ('Local Home Kitchen', 'Veg Starters', 'Mushroom Manchurian',      180, true,  5),
    ('Local Home Kitchen', 'Veg Starters', 'Kaju Mushroom Manchurian', 220, true,  6),

    ('Local Home Kitchen', 'Chicken Starters', 'Chicken Manchurian',   180, false, 0),
    ('Local Home Kitchen', 'Chicken Starters', 'Chicken 65',           200, false, 1),
    ('Local Home Kitchen', 'Chicken Starters', 'Chilli Chicken',       200, false, 2),
    ('Local Home Kitchen', 'Chicken Starters', 'Chicken Majestic',     220, false, 3),
    ('Local Home Kitchen', 'Chicken Starters', 'Kaju Chilli Chicken',  230, false, 4),
    ('Local Home Kitchen', 'Chicken Starters', 'Pepper Chicken',       230, false, 5),
    ('Local Home Kitchen', 'Chicken Starters', 'Chicken Lollipop',     250, false, 6),
    ('Local Home Kitchen', 'Chicken Starters', 'KFC Chicken Lollipop', 300, false, 7),

    ('Local Home Kitchen', 'Paneer Items', 'Paneer Fried Rice',        150, true,  0),
    ('Local Home Kitchen', 'Paneer Items', 'Paneer Noodles',           150, true,  1),

    ('Local Home Kitchen', 'Mushroom Items', 'Mushroom Fried Rice',    150, true,  0),
    ('Local Home Kitchen', 'Mushroom Items', 'Mushroom Noodles',       150, true,  1),

    ('Local Home Kitchen', 'Schezwan Items', 'Veg Schezwan Fried Rice',        120, true,  0),
    ('Local Home Kitchen', 'Schezwan Items', 'Egg Schezwan Fried Rice',        140, false, 1),
    ('Local Home Kitchen', 'Schezwan Items', 'Manchurian Schezwan Fried Rice', 160, true,  2),
    ('Local Home Kitchen', 'Schezwan Items', 'Schezwan Chicken Fried Rice',    170, false, 3),
    ('Local Home Kitchen', 'Schezwan Items', 'Veg Schezwan Noodles',           120, true,  4),
    ('Local Home Kitchen', 'Schezwan Items', 'Egg Schezwan Noodles',           140, false, 5),
    ('Local Home Kitchen', 'Schezwan Items', 'Manchurian Schezwan Noodles',    160, true,  6),
    ('Local Home Kitchen', 'Schezwan Items', 'Schezwan Chicken Noodles',       170, false, 7),

    ('Local Home Kitchen', 'Kaju Items', 'Kaju Rice',            120, true,  0),
    ('Local Home Kitchen', 'Kaju Items', 'Kaju Noodles',         120, true,  1),
    ('Local Home Kitchen', 'Kaju Items', 'Kaju Egg Rice',        130, false, 2),
    ('Local Home Kitchen', 'Kaju Items', 'Kaju Paneer Rice',     180, true,  3),
    ('Local Home Kitchen', 'Kaju Items', 'Kaju Mushroom Rice',   180, true,  4),
    ('Local Home Kitchen', 'Kaju Items', 'Kaju Chicken Rice',    160, false, 5),
    ('Local Home Kitchen', 'Kaju Items', 'Kaju Chicken Noodles', 160, false, 6),

    ('Local Home Kitchen', 'SP Specials', 'SP Chicken Fried Rice',  140, false, 0),
    ('Local Home Kitchen', 'SP Specials', 'SP Chicken Noodles',     140, false, 1),
    ('Local Home Kitchen', 'SP Specials', 'SP Paneer Fried Rice',   200, true,  2),
    ('Local Home Kitchen', 'SP Specials', 'SP Paneer Noodles',      200, true,  3),
    ('Local Home Kitchen', 'SP Specials', 'SP Mushroom Fried Rice', 200, true,  4),
    ('Local Home Kitchen', 'SP Specials', 'SP Mushroom Noodles',    200, true,  5),

    -- Clg Bites Biryani Nation ------------------------------------------
    ('Clg Bites Biryani Nation', 'Chicken Biryani', 'Chicken Dum Biryani (Single)',       200, false, 0),
    ('Clg Bites Biryani Nation', 'Chicken Biryani', 'Chicken Dum Biryani (Full)',         270, false, 1),
    ('Clg Bites Biryani Nation', 'Chicken Biryani', 'Chicken Fry Biryani (Single)',       210, false, 2),
    ('Clg Bites Biryani Nation', 'Chicken Biryani', 'Chicken Fry Biryani (Full)',         280, false, 3),
    ('Clg Bites Biryani Nation', 'Chicken Biryani', 'Chicken Boneless Biryani (Single)',  220, false, 4),
    ('Clg Bites Biryani Nation', 'Chicken Biryani', 'Chicken Boneless Biryani (Full)',    300, false, 5),
    ('Clg Bites Biryani Nation', 'Chicken Biryani', 'Chicken Lollipop Biryani (Single)',  220, false, 6),
    ('Clg Bites Biryani Nation', 'Chicken Biryani', 'Chicken Lollipop Biryani (Full)',    300, false, 7),
    ('Clg Bites Biryani Nation', 'Chicken Biryani', 'Chicken Moghalai Biryani (Single)',  230, false, 8),
    ('Clg Bites Biryani Nation', 'Chicken Biryani', 'Chicken Moghalai Biryani (Full)',    310, false, 9),
    ('Clg Bites Biryani Nation', 'Chicken Biryani', 'Chicken 65 Biryani (Single)',        220, false, 10),
    ('Clg Bites Biryani Nation', 'Chicken Biryani', 'Chicken 65 Biryani (Full)',          300, false, 11),
    ('Clg Bites Biryani Nation', 'Chicken Biryani', 'All Mix Chicken Biryani (Single)',   220, false, 12),
    ('Clg Bites Biryani Nation', 'Chicken Biryani', 'All Mix Chicken Biryani (Full)',     290, false, 13),
    ('Clg Bites Biryani Nation', 'Chicken Biryani', 'Egg Biryani (Single)',               180, false, 14),
    ('Clg Bites Biryani Nation', 'Chicken Biryani', 'Egg Biryani (Full)',                 240, false, 15),

    ('Clg Bites Biryani Nation', 'Veg Biryani', 'Veg Dum Biryani (Single)',               160, true,  0),
    ('Clg Bites Biryani Nation', 'Veg Biryani', 'Veg Dum Biryani (Full)',                 230, true,  1),
    ('Clg Bites Biryani Nation', 'Veg Biryani', 'Paneer Biryani (Single)',                220, true,  2),
    ('Clg Bites Biryani Nation', 'Veg Biryani', 'Paneer Biryani (Full)',                  300, true,  3),
    ('Clg Bites Biryani Nation', 'Veg Biryani', 'Cashew Biryani (Single)',                230, true,  4),
    ('Clg Bites Biryani Nation', 'Veg Biryani', 'Cashew Biryani (Full)',                  310, true,  5),
    ('Clg Bites Biryani Nation', 'Veg Biryani', 'Cashew Paneer Mixed Biryani (Single)',   250, true,  6),
    ('Clg Bites Biryani Nation', 'Veg Biryani', 'Cashew Paneer Mixed Biryani (Full)',     310, true,  7)
  ) as v (restaurant, category, name, price, is_veg, sort_order)
  join public.restaurants r on r.name = v.restaurant
  join public.dish_categories c on c.restaurant_id = r.id and c.name = v.category;
