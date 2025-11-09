import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle, XCircle, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';

interface QueueEntry {
  id: string;
  customer_name: string;
  position: number;
  estimated_wait: number;
  status: string;
  joined_at: string;
  services: {
    name: string;
    duration: number;
    price: number;
  };
}

const QueueManagement = () => {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);

  useEffect(() => {
    loadQueue();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = async () => {
    const { data: shopOwnerData } = await supabase
      .from('shop_owners')
      .select('shop_id')
      .single();

    if (!shopOwnerData) return;
    setShopId(shopOwnerData.shop_id);

    const channel = supabase
      .channel('queue-management')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queues',
          filter: `shop_id=eq.${shopOwnerData.shop_id}`,
        },
        () => {
          loadQueue();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadQueue = async () => {
    try {
      const { data: shopOwnerData } = await supabase
        .from('shop_owners')
        .select('shop_id')
        .single();

      if (!shopOwnerData) return;

      const { data, error } = await supabase
        .from('queues')
        .select('*, services(name, duration, price)')
        .eq('shop_id', shopOwnerData.shop_id)
        .eq('status', 'waiting')
        .order('position');

      if (error) throw error;
      setQueue(data || []);
    } catch (error) {
      console.error('Error loading queue:', error);
      toast.error('Failed to load queue');
    } finally {
      setLoading(false);
    }
  };

  const markAsComplete = async (queueId: string) => {
    try {
      const { error } = await supabase
        .from('queues')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', queueId);

      if (error) throw error;
      toast.success('Customer marked as complete');
    } catch (error) {
      console.error('Error marking complete:', error);
      toast.error('Failed to update queue');
    }
  };

  const cancelEntry = async (queueId: string) => {
    try {
      const { error } = await supabase
        .from('queues')
        .update({ status: 'cancelled' })
        .eq('id', queueId);

      if (error) throw error;
      toast.success('Queue entry cancelled');
    } catch (error) {
      console.error('Error cancelling:', error);
      toast.error('Failed to cancel entry');
    }
  };

  const moveUp = async (entry: QueueEntry) => {
    if (entry.position === 1) return;
    
    try {
      const prevEntry = queue.find(q => q.position === entry.position - 1);
      if (!prevEntry) return;

      await supabase.from('queues').update({ position: entry.position }).eq('id', prevEntry.id);
      await supabase.from('queues').update({ position: entry.position - 1 }).eq('id', entry.id);
      
      toast.success('Position updated');
    } catch (error) {
      console.error('Error moving up:', error);
      toast.error('Failed to update position');
    }
  };

  const moveDown = async (entry: QueueEntry) => {
    if (entry.position === queue.length) return;
    
    try {
      const nextEntry = queue.find(q => q.position === entry.position + 1);
      if (!nextEntry) return;

      await supabase.from('queues').update({ position: entry.position }).eq('id', nextEntry.id);
      await supabase.from('queues').update({ position: entry.position + 1 }).eq('id', entry.id);
      
      toast.success('Position updated');
    } catch (error) {
      console.error('Error moving down:', error);
      toast.error('Failed to update position');
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
        <h2 className="text-3xl font-bold mb-2">Queue Management</h2>
        <p className="text-muted-foreground">Manage your customers waiting in queue</p>
      </div>

      {queue.length === 0 ? (
        <Card className="p-12 text-center bg-card border-border">
          <p className="text-xl text-muted-foreground">No customers in queue</p>
          <p className="text-sm text-muted-foreground mt-2">Customers will appear here when they join your queue</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {queue.map((entry) => (
            <Card key={entry.id} className="p-6 bg-card border-border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className="text-lg font-bold">
                      #{entry.position}
                    </Badge>
                    <h3 className="text-xl font-bold">{entry.customer_name}</h3>
                  </div>
                  
                  <div className="space-y-1 text-muted-foreground">
                    <p>Service: <span className="text-foreground font-semibold">{entry.services.name}</span></p>
                    <p>Duration: {entry.services.duration} min</p>
                    <p>Price: ₹{entry.services.price}</p>
                    <p>Wait Time: ~{entry.estimated_wait} min</p>
                    <p className="text-sm">Joined: {new Date(entry.joined_at).toLocaleTimeString()}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveUp(entry)}
                      disabled={entry.position === 1}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveDown(entry)}
                      disabled={entry.position === queue.length}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-green-500 hover:bg-green-600"
                    onClick={() => markAsComplete(entry.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Complete
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => cancelEntry(entry.id)}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default QueueManagement;
