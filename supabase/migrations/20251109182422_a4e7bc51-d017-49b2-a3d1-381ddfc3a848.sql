-- Add a unique partial index to ensure one active queue per customer
-- This prevents customers from having multiple active queues at database level
CREATE UNIQUE INDEX idx_one_active_queue_per_customer 
ON public.queues (customer_name) 
WHERE status IN ('waiting', 'in_progress');