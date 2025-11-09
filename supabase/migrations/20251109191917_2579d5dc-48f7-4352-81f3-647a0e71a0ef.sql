-- Add shop_id to services table to support shop-specific custom services
ALTER TABLE public.services
ADD COLUMN shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
ADD COLUMN is_custom BOOLEAN DEFAULT false NOT NULL;

-- Add comment to explain the columns
COMMENT ON COLUMN public.services.shop_id IS 'If null, this is a global service. If set, this is a custom service for a specific shop.';
COMMENT ON COLUMN public.services.is_custom IS 'True if this is a shop-specific custom service, false if global.';

-- Update RLS policies for services table
-- Shop owners can create their own custom services
CREATE POLICY "Shop owners can create custom services"
ON public.services
FOR INSERT
WITH CHECK (
  is_custom = true 
  AND shop_id IS NOT NULL 
  AND owns_shop(auth.uid(), shop_id)
);

-- Shop owners can update their own custom services
CREATE POLICY "Shop owners can update their custom services"
ON public.services
FOR UPDATE
USING (
  is_custom = true 
  AND shop_id IS NOT NULL 
  AND owns_shop(auth.uid(), shop_id)
);

-- Shop owners can delete their own custom services
CREATE POLICY "Shop owners can delete their custom services"
ON public.services
FOR DELETE
USING (
  is_custom = true 
  AND shop_id IS NOT NULL 
  AND owns_shop(auth.uid(), shop_id)
);