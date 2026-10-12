-- Add 'at_gate' status to order_status enum (between out_for_delivery and delivered)
-- This represents the rider arriving at Gate 3 before handing over the order
ALTER TYPE public.order_status ADD VALUE 'at_gate' AFTER 'out_for_delivery';

</ARG>