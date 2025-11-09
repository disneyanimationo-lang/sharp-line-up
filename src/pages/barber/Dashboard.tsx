import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, Clock, CheckCircle, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalQueue: 0,
    avgWaitTime: 0,
    completedToday: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get user's shop
      const { data: shopOwnerData } = await supabase
        .from('shop_owners')
        .select('shop_id')
        .single();

      if (!shopOwnerData) return;

      // Get current queue count
      const { count: queueCount } = await supabase
        .from('queues')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopOwnerData.shop_id)
        .eq('status', 'waiting');

      // Get completed today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: completedCount, data: completedQueues } = await supabase
        .from('queues')
        .select('*, services(price)', { count: 'exact' })
        .eq('shop_id', shopOwnerData.shop_id)
        .eq('status', 'completed')
        .gte('completed_at', today.toISOString());

      // Calculate revenue
      const revenue = completedQueues?.reduce((sum, q) => sum + (q.services?.price || 0), 0) || 0;

      // Get average wait time
      const { data: waitingQueues } = await supabase
        .from('queues')
        .select('estimated_wait')
        .eq('shop_id', shopOwnerData.shop_id)
        .eq('status', 'waiting');

      const avgWait = waitingQueues?.length 
        ? waitingQueues.reduce((sum, q) => sum + q.estimated_wait, 0) / waitingQueues.length
        : 0;

      setStats({
        totalQueue: queueCount || 0,
        avgWaitTime: Math.round(avgWait),
        completedToday: completedCount || 0,
        totalRevenue: revenue,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Current Queue',
      value: stats.totalQueue,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Avg Wait Time',
      value: `${stats.avgWaitTime} min`,
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Completed Today',
      value: stats.completedToday,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: "Today's Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Dashboard Overview</h2>
        <p className="text-muted-foreground">Track your shop's performance and queue status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-6 bg-card border-border">
        <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/dashboard/queue" className="p-4 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
            <Users className="w-6 h-6 text-primary mb-2" />
            <h4 className="font-semibold">Manage Queue</h4>
            <p className="text-sm text-muted-foreground">View and update customer queue</p>
          </a>
          <a href="/dashboard/services" className="p-4 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
            <TrendingUp className="w-6 h-6 text-primary mb-2" />
            <h4 className="font-semibold">Update Services</h4>
            <p className="text-sm text-muted-foreground">Manage service offerings</p>
          </a>
          <a href="/dashboard/shop" className="p-4 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
            <CheckCircle className="w-6 h-6 text-primary mb-2" />
            <h4 className="font-semibold">Shop Settings</h4>
            <p className="text-sm text-muted-foreground">Update shop information</p>
          </a>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
