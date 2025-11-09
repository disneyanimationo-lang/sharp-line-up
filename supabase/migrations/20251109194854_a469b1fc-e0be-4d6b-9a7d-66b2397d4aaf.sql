-- Fix security: Set search_path for calculate_distance function
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL, 
  lon1 DECIMAL, 
  lat2 DECIMAL, 
  lon2 DECIMAL
)
RETURNS DECIMAL 
LANGUAGE plpgsql 
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;