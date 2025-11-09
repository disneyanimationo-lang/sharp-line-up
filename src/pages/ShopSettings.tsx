import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

interface Shop {
  id: string;
  name: string;
  address: string;
  rating: number;
  qr_code: string;
  image: string;
}

const ShopSettings = () => {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadShop();
  }, []);

  const loadShop = async () => {
    try {
      const { data: shopOwnerData } = await supabase
        .from('shop_owners')
        .select('shop_id')
        .single();

      if (!shopOwnerData) return;

      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopOwnerData.shop_id)
        .single();

      if (error) throw error;
      setShop(data);
    } catch (error) {
      console.error('Error loading shop:', error);
      toast.error('Failed to load shop details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('shops')
        .update({
          name: shop.name,
          address: shop.address,
        })
        .eq('id', shop.id);

      if (error) throw error;
      toast.success('Shop details updated successfully');
    } catch (error) {
      console.error('Error saving shop:', error);
      toast.error('Failed to update shop details');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!shop) {
    return (
      <Card className="p-12 text-center bg-card border-border">
        <p className="text-xl text-muted-foreground">No shop found</p>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Shop Settings</h2>
        <p className="text-muted-foreground">Update your shop information</p>
      </div>

      <Card className="p-6 bg-card border-border max-w-2xl">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Shop Name</Label>
            <Input
              id="name"
              value={shop.name}
              onChange={(e) => setShop({ ...shop, name: e.target.value })}
              placeholder="Enter shop name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={shop.address}
              onChange={(e) => setShop({ ...shop, address: e.target.value })}
              placeholder="Enter shop address"
            />
          </div>

          <div className="space-y-2">
            <Label>QR Code</Label>
            <div className="p-4 bg-secondary/50 rounded-lg">
              <p className="font-mono text-lg">{shop.qr_code}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Customers can scan this code to join your queue
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="p-4 bg-secondary/50 rounded-lg">
              <p className="text-2xl font-bold text-primary">{shop.rating} ⭐</p>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default ShopSettings;
