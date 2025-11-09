-- Drop the existing restrictive policy for deleting queue services
DROP POLICY IF EXISTS "Shop owners can delete queue services" ON public.queue_services;

-- Create new policies that allow both customers and shop owners to delete queue services
CREATE POLICY "Users can delete their own queue services"
  ON public.queue_services FOR DELETE
  USING (
    -- Allow if user is not authenticated (customer using name only)
    auth.uid() IS NULL
    OR
    -- Allow if shop owner
    EXISTS (
      SELECT 1 FROM public.queues
      WHERE queues.id = queue_services.queue_id
      AND owns_shop(auth.uid(), queues.shop_id)
    )
  );

-- Add update policy for queue_services
CREATE POLICY "Users can update queue services"
  ON public.queue_services FOR UPDATE
  USING (
    -- Allow if user is not authenticated (customer using name only)
    auth.uid() IS NULL
    OR
    -- Allow if shop owner
    EXISTS (
      SELECT 1 FROM public.queues
      WHERE queues.id = queue_services.queue_id
      AND owns_shop(auth.uid(), queues.shop_id)
    )
  );