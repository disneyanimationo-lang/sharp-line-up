-- Add custom price and duration columns to shop_services
-- This allows each shop to customize service pricing and duration
ALTER TABLE public.shop_services
ADD COLUMN custom_price NUMERIC(10,2),
ADD COLUMN custom_duration INTEGER;

-- Add a comment to explain the columns
COMMENT ON COLUMN public.shop_services.custom_price IS 'Shop-specific price override. If null, uses service default price.';
COMMENT ON COLUMN public.shop_services.custom_duration IS 'Shop-specific duration override in minutes. If null, uses service default duration.';

-- Update RLS policy to allow shop owners to update their shop services
CREATE POLICY "Shop owners can update shop services"
ON public.shop_services
FOR UPDATE
USING (owns_shop(auth.uid(), shop_id))
WITH CHECK (owns_shop(auth.uid(), shop_id));