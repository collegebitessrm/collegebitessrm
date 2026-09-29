-- All orders are handed over at VIT-AP Main Gate; there is no room
-- delivery, so hostel block/room is never collected - not per order, not
-- on the student profile. Nothing (policies, functions, triggers, views)
-- references these columns.
--
-- No `cascade` on purpose: if anything unexpected depends on them in the
-- live database, this fails loudly instead of dropping that object too.

alter table public.orders
  drop column delivery_block,
  drop column delivery_room;

alter table public.users
  drop column hostel_block,
  drop column room_number;
