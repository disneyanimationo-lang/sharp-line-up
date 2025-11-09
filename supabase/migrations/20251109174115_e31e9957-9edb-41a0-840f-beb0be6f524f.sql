-- Add rating column to queues table
ALTER TABLE public.queues 
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN IF NOT EXISTS review_text TEXT;

-- Create function to update shop rating
CREATE OR REPLACE FUNCTION public.update_shop_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_rating NUMERIC;
BEGIN
  -- Calculate average rating for the shop
  SELECT AVG(rating)::NUMERIC(3,1)
  INTO avg_rating
  FROM public.queues
  WHERE shop_id = NEW.shop_id
    AND rating IS NOT NULL;
  
  -- Update shop rating
  UPDATE public.shops
  SET rating = COALESCE(avg_rating, 4.5)
  WHERE id = NEW.shop_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to update shop rating when queue rating is added/updated
DROP TRIGGER IF EXISTS update_shop_rating_trigger ON public.queues;
CREATE TRIGGER update_shop_rating_trigger
AFTER INSERT OR UPDATE OF rating ON public.queues
FOR EACH ROW
WHEN (NEW.rating IS NOT NULL)
EXECUTE FUNCTION public.update_shop_rating();