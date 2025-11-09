-- Create shops table
CREATE TABLE public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  rating DECIMAL(2,1) DEFAULT 4.5,
  distance DECIMAL(4,1),
  image TEXT,
  qr_code TEXT UNIQUE NOT NULL,
  current_queue INTEGER DEFAULT 0,
  estimated_wait INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  duration INTEGER NOT NULL,
  price DECIMAL(6,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create shop_services junction table
CREATE TABLE public.shop_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(shop_id, service_id)
);

-- Create queues table
CREATE TABLE public.queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT NOT NULL,
  position INTEGER NOT NULL,
  estimated_wait INTEGER NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shops (public read, no write for customers)
CREATE POLICY "Anyone can view shops"
  ON public.shops FOR SELECT
  USING (true);

-- RLS Policies for services (public read)
CREATE POLICY "Anyone can view services"
  ON public.services FOR SELECT
  USING (true);

-- RLS Policies for shop_services (public read)
CREATE POLICY "Anyone can view shop services"
  ON public.shop_services FOR SELECT
  USING (true);

-- RLS Policies for queues
CREATE POLICY "Anyone can view queues"
  ON public.queues FOR SELECT
  USING (true);

CREATE POLICY "Anyone can join queue"
  ON public.queues FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own queue entries"
  ON public.queues FOR UPDATE
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can delete their own queue entries"
  ON public.queues FOR DELETE
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for shops updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for queues table
ALTER PUBLICATION supabase_realtime ADD TABLE public.queues;

-- Insert sample shops
INSERT INTO public.shops (name, address, rating, distance, image, qr_code) VALUES
  ('Classic Cuts Barbershop', '123 Main St, Downtown', 4.8, 0.5, 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400', 'SHOP001'),
  ('Modern Gentleman Barbers', '456 Oak Ave, Midtown', 4.9, 1.2, 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400', 'SHOP002'),
  ('The Blade & Brush', '789 Elm St, Uptown', 4.7, 2.1, 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400', 'SHOP003'),
  ('Vintage Barber Co.', '321 Pine Rd, East Side', 4.6, 3.0, 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400', 'SHOP004');

-- Insert sample services
INSERT INTO public.services (name, duration, price, description) VALUES
  ('Classic Haircut', 30, 25.00, 'Traditional haircut with scissors and clippers'),
  ('Beard Trim & Shape', 20, 15.00, 'Professional beard trimming and shaping'),
  ('Hot Towel Shave', 25, 30.00, 'Luxurious hot towel straight razor shave'),
  ('Haircut & Beard Combo', 45, 35.00, 'Complete grooming package'),
  ('Kids Haircut', 20, 18.00, 'Haircut for children under 12');

-- Link services to shops (all shops offer most services)
INSERT INTO public.shop_services (shop_id, service_id)
SELECT s.id, sv.id
FROM public.shops s
CROSS JOIN public.services sv
WHERE 
  (s.qr_code = 'SHOP001' AND sv.name IN ('Classic Haircut', 'Beard Trim & Shape', 'Hot Towel Shave', 'Haircut & Beard Combo'))
  OR (s.qr_code = 'SHOP002' AND sv.name IN ('Classic Haircut', 'Beard Trim & Shape', 'Hot Towel Shave', 'Kids Haircut'))
  OR (s.qr_code = 'SHOP003')
  OR (s.qr_code = 'SHOP004' AND sv.name IN ('Classic Haircut', 'Beard Trim & Shape', 'Hot Towel Shave'));