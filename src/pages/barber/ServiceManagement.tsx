import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string;
  isOffered?: boolean;
}

const ServiceManagement = () => {
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const { data: shopOwnerData } = await supabase
        .from('shop_owners')
        .select('shop_id')
        .single();

      if (!shopOwnerData) return;
      setShopId(shopOwnerData.shop_id);

      // Get all available services
      const { data: services } = await supabase
        .from('services')
        .select('*')
        .order('name');

      // Get services offered by this shop
      const { data: shopServices } = await supabase
        .from('shop_services')
        .select('service_id')
        .eq('shop_id', shopOwnerData.shop_id);

      const offeredServiceIds = new Set(shopServices?.map(s => s.service_id) || []);

      const servicesWithStatus = services?.map(service => ({
        ...service,
        isOffered: offeredServiceIds.has(service.id),
      })) || [];

      setAllServices(servicesWithStatus);
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const addService = async (serviceId: string) => {
    if (!shopId) return;

    try {
      const { error } = await supabase
        .from('shop_services')
        .insert({ shop_id: shopId, service_id: serviceId });

      if (error) throw error;
      toast.success('Service added successfully');
      loadServices();
    } catch (error) {
      console.error('Error adding service:', error);
      toast.error('Failed to add service');
    }
  };

  const removeService = async (serviceId: string) => {
    if (!shopId) return;

    try {
      const { error } = await supabase
        .from('shop_services')
        .delete()
        .eq('shop_id', shopId)
        .eq('service_id', serviceId);

      if (error) throw error;
      toast.success('Service removed successfully');
      loadServices();
    } catch (error) {
      console.error('Error removing service:', error);
      toast.error('Failed to remove service');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Service Management</h2>
        <p className="text-muted-foreground">Manage the services your shop offers</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allServices.map((service) => (
          <Card key={service.id} className="p-6 bg-card border-border">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-bold">{service.name}</h3>
              {service.isOffered && (
                <Badge variant="default">Active</Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-semibold">{service.duration} min</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-semibold text-primary">₹{service.price}</span>
              </div>
            </div>

            {service.isOffered ? (
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => removeService(service.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Service
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="w-full"
                onClick={() => addService(service.id)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add to Shop
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ServiceManagement;
