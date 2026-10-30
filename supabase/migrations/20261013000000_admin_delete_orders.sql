-- Admin can delete orders in terminal states (delivered / cancelled).
-- Active orders (pending → at_gate) can't be deleted — the student's live
-- tracking page would be left pointing at a gone row.
create policy "Admins can delete terminal orders" on public.orders
  for delete to authenticated
  using ((select public.is_admin()) and status in ('delivered', 'cancelled'));