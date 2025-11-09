import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string;
  isOffered?: boolean;
  customPrice?: number;
  customDuration?: number;
  shopServiceId?: string;
}

const ServiceManagement = () => {
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editDuration, setEditDuration] = useState('');

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

      // Get services offered by this shop with custom pricing
      const { data: shopServices } = await supabase
        .from('shop_services')
        .select('id, service_id, custom_price, custom_duration')
        .eq('shop_id', shopOwnerData.shop_id);

      const shopServiceMap = new Map(
        shopServices?.map(s => [s.service_id, s]) || []
      );

      const servicesWithStatus = services?.map(service => {
        const shopService = shopServiceMap.get(service.id);
        return {
          ...service,
          isOffered: !!shopService,
          customPrice: shopService?.custom_price ?? undefined,
          customDuration: shopService?.custom_duration ?? undefined,
          shopServiceId: shopService?.id,
        };
      }) || [];

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

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setEditPrice((service.customPrice ?? service.price).toString());
    setEditDuration((service.customDuration ?? service.duration).toString());
  };

  const saveServiceEdit = async () => {
    if (!editingService?.shopServiceId) return;

    try {
      const { error } = await supabase
        .from('shop_services')
        .update({
          custom_price: editPrice ? parseFloat(editPrice) : null,
          custom_duration: editDuration ? parseInt(editDuration) : null,
        })
        .eq('id', editingService.shopServiceId);

      if (error) throw error;
      toast.success('Service updated successfully');
      setEditingService(null);
      loadServices();
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error('Failed to update service');
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
                <span className="font-semibold">
                  {service.customDuration ?? service.duration} min
                  {service.customDuration && (
                    <span className="text-xs text-muted-foreground ml-1">
                      (default: {service.duration})
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-semibold text-primary">
                  ₹{service.customPrice ?? service.price}
                  {service.customPrice && (
                    <span className="text-xs text-muted-foreground ml-1">
                      (default: ₹{service.price})
                    </span>
                  )}
                </span>
              </div>
            </div>

            {service.isOffered ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEditDialog(service)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={() => removeService(service.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
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

      <Dialog open={!!editingService} onOpenChange={() => setEditingService(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Customize pricing and duration for {editingService?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                placeholder={`Default: ₹${editingService?.price}`}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use default price (₹{editingService?.price})
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                placeholder={`Default: ${editingService?.duration} min`}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use default duration ({editingService?.duration} min)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingService(null)}>
              Cancel
            </Button>
            <Button onClick={saveServiceEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceManagement;
