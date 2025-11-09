import { supabase } from "@/integrations/supabase/client";

// Get all shops with queue info
export const getShops = async (searchQuery = '') => {
  try {
    let query = supabase
      .from('shops')
      .select('*')
      .order('distance');

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;
    
    if (error) throw error;

    // Get current queue counts for each shop
    const shopsWithQueue = await Promise.all(
      data.map(async (shop) => {
        const { count } = await supabase
          .from('queues')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', shop.id)
          .eq('status', 'waiting');

        return {
          ...shop,
          currentQueue: count || 0,
        };
      })
    );

    return { data: shopsWithQueue, error: null };
  } catch (error) {
    console.error('Error fetching shops:', error);
    return { data: null, error: error.message };
  }
};

// Get shop by ID
export const getShop = async (shopId) => {
  try {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('id', shopId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching shop:', error);
    return { data: null, error: error.message };
  }
};

// Get shop by QR code
export const getShopByQR = async (qrCode) => {
  try {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('qr_code', qrCode)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching shop by QR:', error);
    return { data: null, error: error.message };
  }
};

// Get services for a shop
export const getShopServices = async (shopId) => {
  try {
    const { data, error } = await supabase
      .from('shop_services')
      .select(`
        service_id,
        services (
          id,
          name,
          duration,
          price,
          description
        )
      `)
      .eq('shop_id', shopId);

    if (error) throw error;

    const services = data.map(item => item.services);
    return { data: services, error: null };
  } catch (error) {
    console.error('Error fetching shop services:', error);
    return { data: null, error: error.message };
  }
};

// Join queue with multiple services
export const joinQueue = async (shopId, serviceIds, customerName) => {
  try {
    // Check if customer already has an active queue entry
    const { data: existingQueue } = await supabase
      .from('queues')
      .select('id')
      .eq('customer_name', customerName)
      .in('status', ['waiting', 'in_progress'])
      .limit(1)
      .maybeSingle();

    if (existingQueue) {
      return { 
        data: null, 
        error: 'You already have an active queue entry. Please complete or cancel it first.' 
      };
    }

    // Get current queue position
    const { count } = await supabase
      .from('queues')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId)
      .eq('status', 'waiting');

    const position = (count || 0) + 1;

    // Get total duration for all selected services
    const { data: services } = await supabase
      .from('services')
      .select('duration')
      .in('id', serviceIds);

    const totalDuration = services?.reduce((sum, service) => sum + service.duration, 0) || 30;
    const estimatedWait = position * totalDuration;

    // Insert queue entry (with first service as primary for backward compatibility)
    const { data: queueData, error: queueError } = await supabase
      .from('queues')
      .insert({
        shop_id: shopId,
        service_id: serviceIds[0],
        customer_name: customerName,
        position,
        estimated_wait: estimatedWait,
        status: 'waiting'
      })
      .select()
      .single();

    if (queueError) throw queueError;

    // Insert all services into queue_services junction table
    const queueServices = serviceIds.map(serviceId => ({
      queue_id: queueData.id,
      service_id: serviceId
    }));

    const { error: servicesError } = await supabase
      .from('queue_services')
      .insert(queueServices);

    if (servicesError) throw servicesError;

    return { data: queueData, error: null };
  } catch (error) {
    console.error('Error joining queue:', error);
    return { data: null, error: error.message };
  }
};

// Get queue status
export const getQueueStatus = async (queueId) => {
  try {
    const { data, error } = await supabase
      .from('queues')
      .select('*')
      .eq('id', queueId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching queue status:', error);
    return { data: null, error: error.message };
  }
};

// Cancel queue entry
export const cancelQueue = async (queueId) => {
  try {
    const { error } = await supabase
      .from('queues')
      .update({ status: 'cancelled' })
      .eq('id', queueId);

    if (error) throw error;
    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Error cancelling queue:', error);
    return { data: null, error: error.message };
  }
};

// Submit rating for completed service
export const submitRating = async (queueId, rating, reviewText = '') => {
  try {
    const { error } = await supabase
      .from('queues')
      .update({ 
        rating,
        review_text: reviewText
      })
      .eq('id', queueId);

    if (error) throw error;
    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Error submitting rating:', error);
    return { data: null, error: error.message };
  }
};
