-- Create a junction table for multiple services per queue entry
CREATE TABLE IF NOT EXISTS public.queue_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID NOT NULL REFERENCES public.queues(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(queue_id, service_id)
);

-- Enable RLS on queue_services
ALTER TABLE public.queue_services ENABLE ROW LEVEL SECURITY;

-- RLS policies for queue_services
CREATE POLICY "Anyone can view queue services"
  ON public.queue_services FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert queue services"
  ON public.queue_services FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Shop owners can delete queue services"
  ON public.queue_services FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.queues
      WHERE queues.id = queue_services.queue_id
      AND owns_shop(auth.uid(), queues.shop_id)
    )
  );