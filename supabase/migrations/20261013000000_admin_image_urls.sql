-- Admin-editable cover images for restaurants and dishes.
-- The static photo lookup (dish-photos.ts) remains the fallback when
-- these are null — existing photos keep working without any change.

ALTER TABLE restaurants
  ADD COLUMN cover_image_url text;

ALTER TABLE dishes
  ADD COLUMN image_url text;
