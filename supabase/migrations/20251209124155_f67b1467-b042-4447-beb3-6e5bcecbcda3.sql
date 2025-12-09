-- Create enum for payment preference
CREATE TYPE public.payment_preference AS ENUM ('pay_now', 'pay_at_shop', 'pay_after_service');

-- Create enum for priority type
CREATE TYPE public.priority_type AS ENUM ('regular', 'loyalty', 'emergency', 'vip');

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  payment_preference payment_preference NOT NULL DEFAULT 'pay_at_shop',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  priority_type priority_type NOT NULL DEFAULT 'regular',
  emergency_reason TEXT,
  total_price NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(shop_id, appointment_date, appointment_time)
);

-- Create appointment_services junction table
CREATE TABLE public.appointment_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create customer_loyalty table for tracking visits
CREATE TABLE public.customer_loyalty (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  visit_count INTEGER NOT NULL DEFAULT 0,
  is_vip BOOLEAN NOT NULL DEFAULT false,
  last_visit_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, shop_id)
);

-- Add priority_type to queues table
ALTER TABLE public.queues ADD COLUMN IF NOT EXISTS priority_type priority_type DEFAULT 'regular';
ALTER TABLE public.queues ADD COLUMN IF NOT EXISTS payment_preference payment_preference DEFAULT 'pay_at_shop';
ALTER TABLE public.queues ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_loyalty ENABLE ROW LEVEL SECURITY;

-- RLS policies for appointments
CREATE POLICY "Anyone can view appointments" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own appointments" ON public.appointments FOR UPDATE USING (user_id = auth.uid() OR owns_shop(auth.uid(), shop_id));
CREATE POLICY "Shop owners can delete appointments" ON public.appointments FOR DELETE USING (owns_shop(auth.uid(), shop_id));

-- RLS policies for appointment_services
CREATE POLICY "Anyone can view appointment services" ON public.appointment_services FOR SELECT USING (true);
CREATE POLICY "Users can insert appointment services" ON public.appointment_services FOR INSERT WITH CHECK (true);

-- RLS policies for customer_loyalty
CREATE POLICY "Anyone can view loyalty" ON public.customer_loyalty FOR SELECT USING (true);
CREATE POLICY "System can manage loyalty" ON public.customer_loyalty FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update loyalty" ON public.customer_loyalty FOR UPDATE USING (true);

-- Function to increment loyalty visit count
CREATE OR REPLACE FUNCTION public.increment_loyalty_visit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.user_id IS NOT NULL THEN
    INSERT INTO public.customer_loyalty (user_id, shop_id, visit_count, last_visit_at)
    VALUES (NEW.user_id, NEW.shop_id, 1, now())
    ON CONFLICT (user_id, shop_id) 
    DO UPDATE SET 
      visit_count = customer_loyalty.visit_count + 1,
      last_visit_at = now(),
      is_vip = CASE WHEN customer_loyalty.visit_count + 1 >= 10 THEN true ELSE customer_loyalty.is_vip END,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for loyalty tracking on queue completion
CREATE TRIGGER on_queue_completed
  AFTER UPDATE ON public.queues
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_loyalty_visit();

-- Also track for appointments
CREATE OR REPLACE FUNCTION public.increment_appointment_loyalty()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.user_id IS NOT NULL THEN
    INSERT INTO public.customer_loyalty (user_id, shop_id, visit_count, last_visit_at)
    VALUES (NEW.user_id, NEW.shop_id, 1, now())
    ON CONFLICT (user_id, shop_id) 
    DO UPDATE SET 
      visit_count = customer_loyalty.visit_count + 1,
      last_visit_at = now(),
      is_vip = CASE WHEN customer_loyalty.visit_count + 1 >= 10 THEN true ELSE customer_loyalty.is_vip END,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_appointment_completed
  AFTER UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_appointment_loyalty();