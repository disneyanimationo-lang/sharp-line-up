import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Star, Clock, Search, Loader2, ArrowLeft } from 'lucide-react';
import { getShops } from '@/services/queueApi';
import ActiveQueue from './ActiveQueue';

const ShopList = ({ onShopSelect, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [showActiveQueue, setShowActiveQueue] = useState(false);

  useEffect(() => {
    loadShops();
    
    // Load customer name from localStorage
    const savedName = localStorage.getItem('customerName');
    if (savedName) {
      setCustomerName(savedName);
      setShowActiveQueue(true);
    }
  }, []);

  const loadShops = async () => {
    setLoading(true);
    const { data, error } = await getShops(searchQuery);
    if (!error && data) {
      setShops(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadShops();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (customerName.trim()) {
      localStorage.setItem('customerName', customerName.trim());
      setShowActiveQueue(true);
    }
  };

  const handleQueueCancelled = () => {
    setShowActiveQueue(false);
    localStorage.removeItem('customerName');
    setCustomerName('');
  };

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        {onBack && (
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Find A Barber</h1>
          <p className="text-xl text-muted-foreground">Browse nearby shops and check their queue status</p>
        </div>

        {/* Active Queue Section */}
        {showActiveQueue && customerName && (
          <div className="mb-8">
            <ActiveQueue 
              customerName={customerName} 
              onQueueCancelled={handleQueueCancelled}
            />
          </div>
        )}

        {/* Check Queue Status Form */}
        {!showActiveQueue && (
          <Card className="p-6 mb-8 bg-card border-border max-w-md">
            <h3 className="text-lg font-bold mb-4">Check Your Queue Status</h3>
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div>
                <Label htmlFor="checkName">Enter your name</Label>
                <Input
                  id="checkName"
                  placeholder="Your name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-2"
                />
              </div>
              <Button type="submit" className="w-full">
                Check Queue Status
              </Button>
            </form>
          </Card>
        )}

        {/* Search Bar */}
        <div className="mb-8 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            type="text"
            placeholder="Search by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-6 text-lg bg-card border-border"
          />
        </div>

        {/* Shop Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : shops.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">No shops found matching your search.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {shops.map((shop) => (
              <Card key={shop.id} className="p-6 bg-card border-border hover:border-primary/50 transition-all duration-300">
                <img 
                  src={shop.image} 
                  alt={shop.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{shop.name}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <MapPin className="w-4 h-4" />
                      <span>{shop.address}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-primary text-primary" />
                      <span className="font-semibold">{shop.rating}</span>
                      <span className="text-muted-foreground ml-2">• {shop.distance} miles</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 mb-4 py-4 px-4 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">Wait Time</div>
                      <div className="font-bold">{shop.estimated_wait || 0} min</div>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-border"></div>
                  <div>
                    <div className="text-sm text-muted-foreground">In Queue</div>
                    <div className="font-bold">{shop.currentQueue || 0} people</div>
                  </div>
                </div>

                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => onShopSelect(shop)}
                >
                  Join Queue
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopList;
