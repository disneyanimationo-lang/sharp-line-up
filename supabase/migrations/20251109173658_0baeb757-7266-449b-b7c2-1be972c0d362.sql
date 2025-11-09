-- Add additional columns to shops table
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT '{"monday": "9:00 AM - 6:00 PM", "tuesday": "9:00 AM - 6:00 PM", "wednesday": "9:00 AM - 6:00 PM", "thursday": "9:00 AM - 6:00 PM", "friday": "9:00 AM - 6:00 PM", "saturday": "9:00 AM - 5:00 PM", "sunday": "Closed"}'::jsonb;

-- Drop existing policy if it exists and recreate
DROP POLICY IF EXISTS "Shop owners can create their shops" ON public.shops;

-- Allow shop owners to insert their shops
CREATE POLICY "Shop owners can create their shops"
ON public.shops
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'shop_owner'::app_role
  )
);

-- Drop and recreate shop_owners insert policy
DROP POLICY IF EXISTS "Shop owners can link themselves to shops" ON public.shop_owners;

CREATE POLICY "Shop owners can link themselves to shops"
ON public.shop_owners
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());