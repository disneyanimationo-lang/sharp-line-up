-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('customer', 'shop_owner', 'admin');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create shop_owners table to link users to shops
CREATE TABLE public.shop_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, shop_id)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_owners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for shop_owners
CREATE POLICY "Shop owners can view their shops"
  ON public.shop_owners FOR SELECT
  USING (auth.uid() = user_id);

-- Create security definer function to check if user has role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create security definer function to check if user owns shop
CREATE OR REPLACE FUNCTION public.owns_shop(_user_id UUID, _shop_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shop_owners
    WHERE user_id = _user_id
      AND shop_id = _shop_id
  )
$$;

-- Update RLS policies for shops to allow shop owners to update
CREATE POLICY "Shop owners can update their shops"
  ON public.shops FOR UPDATE
  USING (public.owns_shop(auth.uid(), id));

-- Update RLS policies for queues to allow shop owners to manage
CREATE POLICY "Shop owners can update queues for their shops"
  ON public.queues FOR UPDATE
  USING (public.owns_shop(auth.uid(), shop_id));

CREATE POLICY "Shop owners can delete queues for their shops"
  ON public.queues FOR DELETE
  USING (public.owns_shop(auth.uid(), shop_id));

-- Add policies for services management
CREATE POLICY "Shop owners can insert shop services"
  ON public.shop_services FOR INSERT
  WITH CHECK (public.owns_shop(auth.uid(), shop_id));

CREATE POLICY "Shop owners can delete shop services"
  ON public.shop_services FOR DELETE
  USING (public.owns_shop(auth.uid(), shop_id));

-- Create sample shop owner (you'll need to sign up first, then link)
-- This is just the structure - actual user will be created via signup