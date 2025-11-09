import { supabase } from "@/integrations/supabase/client";

// Check if customer has an active queue entry
export const getActiveQueue = async (customerName) => {
  try {
    const { data, error } = await supabase
      .from('queues')
      .select('*, shops(name), queue_services(services(*))')
      .eq('customer_name', customerName)
      .in('status', ['waiting', 'in_progress'])
      .maybeSingle();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching active queue:', error);
    return { data: null, error: error.message };
  }
};

// Update services in active queue
export const updateQueueServices = async (queueId, serviceIds) => {
  try {
    // Delete existing queue_services
    const { error: deleteError } = await supabase
      .from('queue_services')
      .delete()
      .eq('queue_id', queueId);

    if (deleteError) throw deleteError;

    // Insert new queue_services
    const queueServices = serviceIds.map(serviceId => ({
      queue_id: queueId,
      service_id: serviceId,
    }));

    const { error: insertError } = await supabase
      .from('queue_services')
      .insert(queueServices);

    if (insertError) throw insertError;

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Error updating queue services:', error);
    return { data: null, error: error.message };
  }
};
