-- Add latitude and longitude columns to shops table
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Update existing shops with sample coordinates (you can update these later)
UPDATE public.shops SET latitude = 40.7128, longitude = -74.0060 WHERE qr_code = 'SHOP001';
UPDATE public.shops SET latitude = 40.7580, longitude = -73.9855 WHERE qr_code = 'SHOP002';
UPDATE public.shops SET latitude = 40.7489, longitude = -73.9680 WHERE qr_code = 'SHOP003';
UPDATE public.shops SET latitude = 40.7614, longitude = -73.9776 WHERE qr_code = 'SHOP004';

-- Create function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL, 
  lon1 DECIMAL, 
  lat2 DECIMAL, 
  lon2 DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  R DECIMAL := 6371; -- Earth's radius in kilometers
  dLat DECIMAL;
  dLon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dLat := radians(lat2 - lat1);
  dLon := radians(lon2 - lon1);
  
  a := sin(dLat/2) * sin(dLat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dLon/2) * sin(dLon/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN R * c; -- Distance in kilometers
END;
$$ LANGUAGE plpgsql IMMUTABLE;